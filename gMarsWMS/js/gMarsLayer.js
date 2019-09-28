// Only proof on concept, NOT LICENSED BY GOOGLE
L.TileLayer.GoogleMarsWMS = L.TileLayer.extend({
	initialize: function (url, options) {
		this._url = url;
		var wmtsParams = L.extend({}, this.defaultWmtsParams),
			tileSize = options.tileSize || this.options.tileSize;
			for (var i in options) {
				if (!this.options.hasOwnProperty(i) && i!="matrixIds") {
					wmtsParams[i] = options[i];
				}
			}
			this.wmtsParams = wmtsParams;
			this.catalogue = options.catalogue;
			L.setOptions(this, options);
		},
	onAdd: function (map) {
			L.TileLayer.prototype.onAdd.call(this, map);
		},
	getTileUrl: function (tilePoint) {
		var zoom = tilePoint.z;
		var bound = Math.pow(2, zoom);
		var x = tilePoint.x;
		var y = tilePoint.y;
		// console.log(" " + zoom + " " + x + " " + y );
		if (y < 0 || y >= bound) { // Don't repeat across y-axis (vertically).
			return null;
		}			
		if (x < 0 || x >= bound) { // Repeat across x-axis.
		x = (x % bound + bound) % bound;
		}
		var qstr = 't';
		for (var z = 0; z < zoom; z++) {
			bound = bound / 2;
			if (y < bound) {
				if (x < bound) {
					qstr += 'q';
				} else {
					qstr += 'r';
					x -= bound;
				}
			} else {
				if (x < bound) {
					qstr += 't';
					y -= bound;
				} else {
					qstr += 's';
					x -= bound;
					y -= bound;
				}
			}
		}
		return 'https://' + 'mw1.google.com/mw-planetary/mars/' + this.catalogue + '/' + qstr + '.jpg';
	}
});

L.TileLayer.GoogleMarsWMS.defaultLayers = [
	{
		maxZoom: 8,
		catalogue: 'elevation'
	},
	{
		maxZoom: 9,
		catalogue: 'visible'
	},
	{
		maxZoom: 13,
		catalogue: 'infrared'
	}
];

L.TileLayer.GoogleMarsWMS.attribution = 'NASA / JPL / GSFC / Arizona State University';

L.TileLayer.GoogleMarsWMS.defaultGroup = function ()
{	
	var GMl = L.TileLayer.GoogleMarsWMS.defaultLayers;
	gL = {};
	for (l in GMl){
		gL[GMl[l].catalogue] = new L.TileLayer.GoogleMarsWMS('', {
			maxZoom: GMl[l].maxZoom,
			catalogue: GMl[l].catalogue,
			attribution: L.TileLayer.GoogleMarsWMS.attribution,
			id : 'googleNet' + GMl[l].catalogue
		});
	}
	var a = [];
	for (g in gL){
		a.push({
			name: g,
			layer: gL[g]
		});
	}
	return a;
}

function GoogleMarsLocalGroup (base){
	var GMl = L.TileLayer.GoogleMarsWMS.defaultLayers;
	var gTL = 'file://' + base + '/{srv}/{z}/{x}-{y}';
	gL = {};
	for (l in GMl){
		gL[ GMl[l].catalogue] = new L.TileLayer(gTL, {
			srv : GMl[l].catalogue,
			maxZoom: GMl[l].maxZoom,
			attribution: L.TileLayer.GoogleMarsWMS.attribution,
			id : 'googleNet' + GMl[l].catalogue
		});
	}
	var a = [];
	for (g in gL){
		a.push({
			name: g,
			layer: gL[g]
		});
	}
	return a;	
}

function gMars_group(google_data, img_pref){
	var gIndex = {};
	var gLA = new L.LayerGroup();
	for (g in google_data){
		var gO = google_data[g];
		var gCateg = gO.UAI_ct.sing;
		var gn = "<b>" + gO.name + "</b>";
		var insc = (gO.url ? "<a href = \"" + gO.url + " \">" + gn + "</a>" : gn ) + '</br>' +
		(gO.img ? "<img style=\"float:left;\" src=\"" + img_pref + gO.img + " \">" + "</img> " : '' ) +
		/*'</br>' + */ gO.gDescr + '</br>' + '(' + gO.date + ')' + " {" + gO.UAI_ct.sing + (gO.categ ? ' : ' + gO.categ : '') + '}';

		if (typeof gIndex[gCateg] == 'undefined')
			gIndex[gCateg] = new L.LayerGroup();
		var layer = L.marker([gO.center[1], gO.center[0]]);
		layer.bindPopup(insc, { maxHeight: 200 });
		var sc = 'spacecraft'
		layer.options.icon = L.icon({
			iconUrl: 'data/' + ( (gO.UAI_ct.sing == sc) ? 'm2' : (gCateg == '•') ? 'm6' : 'm3' ) + '.png',
			iconSize:	[21, 34], // size of the icon
			iconAnchor: [11, 34], // point of the icon which will correspond to marker's location
			popupAnchor: [0, -20]
		});
		layer._el = gO;

		gIndex[gCateg].addLayer(layer);
		gLA.addLayer(layer);
	}
	delete gO; delete gn; delete insc; delete layer;
	var gLayers = [];
	gLayers.push({
		// active: true,
		name: "∀ Google",
		layer: gLA
	});
	for (gl in gIndex){
		gLayers.push({
			// active: true,
			name: gl,
			layer: gIndex[gl]
		});
	}
	var gGr = {
		group: "Google",
		collapsed: true,
		layers: gLayers
	}
	return gGr;
}
