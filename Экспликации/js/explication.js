explication = {};

explication.get_data = function (osm_relation_id, fin_ok) {
    var xhr = new XMLHttpRequest();
    xhr.url = geoAlb_lib.OSM_URL('relation', osm_relation_id, 'full');
    xhr.osm_relation_id = osm_relation_id;
    xhr.open('GET', xhr.url, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200 && (xhr.status != 0 || xhr.response)) {
            alert("Ошибка БД OSM! " + xhr.url);
			return;
        }
		if (xhr.status == 200){
            log('Данные по контуру получены ');
            explication.getAllgeoData(xhr.responseXML, xhr.osm_relation_id, fin_ok);
			return;
        }
		Console.log (xhr.status);
    }
}

// Формирование экспликационной таблицы по массиву
explication.tabulation = function (table_obj) {
    tbl = document.createElement('table');
    tbl.setAttribute('role', 'expl');
    var tr = document.createElement('tr');
    tr.setAttribute('role', 'expl');
    for (var j in table_obj[0]) {
        if (j.indexOf('_') == 0)
            continue;
        var th = document.createElement('th');
        th.setAttribute('role', 'expl');
        th.innerHTML = j.replace('_', ' ');
        tr.appendChild(th);
    }
    tbl.appendChild(tr);

    for (var i_ in table_obj) {
        var площадка = table_obj[i_];
        var tr = document.createElement('tr');
        tr.setAttribute('role', 'expl');
        for (var j in площадка) {
            if (j.indexOf('_') == 0)
                continue;
            var td = document.createElement('td');
            td.setAttribute('role', 'expl');
            td.innerHTML = площадка[j];
            tr.appendChild(td);
        }
        tbl.appendChild(tr);
    }
    return tbl;
};

explication.map = function (div, geoJsonGeneral, map_prov) {
    var cen = geoJsonGeneral.features[0].geometry.coordinates[0][0];
    var md = new mapDiv(
        div,
        [cen[1], cen[0]],
        map_prov.tileLayers,
        map_prov.Names,
        {
            ini: 14,
            min: 8,
            max: 20
        },
        true
    );
    var mrg = explication.main_rel(geoJsonGeneral);
    var n = mrg.properties.tags.name;
    var mr = L.geoJSON(mrg, { fillOpacity: 0, color: "#F2872F" });
    md.map.fitBounds(mr.getBounds());
    md.Control.addOverlay(mr, n);
    md.map.addLayer(mr); 
    //  md.map.setZoom(md.map.getZoom() + 1);
    return md;
}

explication.getAllgeoData = function (osm_main_rel_xml, osm_main_rel_id, f_ok) {
    var mr = geoAlb_lib.osmRelationGeoJson(osm_main_rel_xml, osm_main_rel_id);
    var gJs = L.geoJSON(mr);

    var xhr = new XMLHttpRequest();
    xhr.url = 'https://www.openstreetmap.org/api/0.6/map?bbox=' + gJs.getBounds().toBBoxString();
    xhr.open('GET', xhr.url, true);
    xhr.osm_relation_id = osm_main_rel_id;
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200 && (xhr.status != 0 || xhr.response)) {
            alert("Ошибка БД OSM! " + xhr.url);
        } else {
            if (typeof (f_ok) == 'function')
                f_ok(xhr);
        }
    }
}

// Выделение основного отношения из массива geoJSON
explication.main_rel = function (geoJsonGeneral) {
    if (!geoJsonGeneral.osm_relation_id)
        throw (".osm_relation_id !");
    for (var i in geoJsonGeneral.features) {
        var el = geoJsonGeneral.features[i];
        if (el.properties.id == geoJsonGeneral.osm_relation_id)
            return el;
    }
    return null;
}

/**
* Представляет карту, действующую в блоке
* @constructor
* @param {div} div - Блок для размещенеия карты.
* @param {LonLat} centerGeo - Координаты центра карты.
* @param {int} zoom - Условный масштаб.
* @param {int} minZ - мимнимальный условный масштаб.
* @param {int} maxZ - максимальный условный масштаб.
* @param {bool} controls - включать ли преключатель своёв.
*/
function mapDiv(div, centerGeo, provider, providerName, Z, controls) {
    this.div = div;
    this.map = L.map(div.getAttribute('id'), { keyboard: false });
    if (!isNaN(centerGeo[0]) && !isNaN(centerGeo[1]) && !isNaN(Z.ini))
        this.map.setView(centerGeo, Z.ini);
    if (Z) {
        this.map.setMinZoom(Z.min);
        this.map.setMaxZoom(Z.max);
    }
    var a = Array.isArray(provider);
    var prov0 = (a ? provider[0] : provider);
    this.ini_layer = (typeof prov0 === 'string') ? L.tileLayer.provider(prov0) : prov0;
    this.ini_layer.addTo(this.map);
    if (controls) {
        this.Control = new L.Control.Layers();
        var n0 = providerName ? (Array.isArray(providerName) ? providerName[0] : providerName) : ((typeof prov0 === 'string') ? prov0 : '?');
        this.Control.addBaseLayer(this.ini_layer, n0);
        if (a) {
            for (var i in provider) {
                if (i != 0) {
                    var prov = provider[i];
                    var provStr = providerName[i] ? providerName[i] : ((typeof prov === 'string') ? prov : '?');
                    this.Control.addBaseLayer((typeof prov === 'string') ? L.tileLayer.provider(prov) : prov, provStr);
                }
            }
        }
        this.map.addControl(this.Control);
    }
}

// БЛОК ГЕОМЕТРИИ
explication.γεωμετρία = {};

// БЛОК ВЫЧИСЛЕНИЯ ДЛИНЫ
explication.γεωμετρία.len = function (geometry) {
    if (geometry.type === 'LineString')
        return geoJSON_len(geometry.coordinates);
    else if (geometry.type === 'MultiLineString')
        return geometry.coordinates.reduce(function (memo, coordinates) {
            return memo + geoJSON_len(coordinates);
        }, 0);
    else
        return null;

    function geoJSON_len(lineString) {
        if (lineString.length < 2)
            return 0;
        var result = 0;
        for (var i = 1; i < lineString.length; i++)
            result += distance(lineString[i - 1][0], lineString[i - 1][1],
                lineString[i][0], lineString[i][1]);
        return result;
    }

    /**
     * Calculate the approximate distance between two coordinates (lat/lon)
     *
     * © Chris Veness, MIT-licensed,
     * http://www.movable-type.co.uk/scripts/latlong.html#equirectangular
     */
    function distance(λ1, φ1, λ2, φ2) {
        var R = 6371000;
        var Δλ = (λ2 - λ1) * Math.PI / 180;
        φ1 = φ1 * Math.PI / 180;
        φ2 = φ2 * Math.PI / 180;
        var x = Δλ * Math.cos((φ1 + φ2) / 2);
        var y = (φ2 - φ1);
        var d = Math.sqrt(x * x + y * y);
        return R * d;
    };
}

// БЛОК ВЫЧИСЛЕНИЯ ПЛОЩАДИ
explication.γεωμετρία.sqf = function (_) {
    var area = 0, i;
    switch (_.type) {
        case 'LineString':
        case 'MultiLineString':
        case 'Polygon':
            return polygonArea(_.coordinates);
        case 'MultiPolygon':
            for (i = 0; i < _.coordinates.length; i++) {
                area += polygonArea(_.coordinates[i]);
            }
            return area;
        case 'Point':
            return 0;
        case 'GeometryCollection':
            for (i = 0; i < _.geometries.length; i++) {
                area += explication.γεωμετρία.sqf(_.geometries[i]);
            }
            return area;
    }

    function polygonArea(coords) {
        var area = 0;
        if (coords && coords.length > 0) {
            area += Math.abs(ringArea(coords[0]));
            for (var i = 1; i < coords.length; i++) {
                area -= Math.abs(ringArea(coords[i]));
            }
        }
        return area;
    }

    /**
     * Calculate the approximate area of the polygon were it projected onto
     *     the earth.  Note that this area will be positive if ring is oriented
     *     clockwise, otherwise it will be negative.
     *
     * Reference:
     * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
     *     Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
     *     Laboratory, Pasadena, CA, June 2007 http://trs-new.jpl.nasa.gov/dspace/handle/2014/40409
     *
     * Returns:
     * {float} The approximate signed geodesic area of the polygon in square
     *     meters.
     */

    function ringArea(coords) {
        var p1, p2, p3, lowerIndex, middleIndex, upperIndex, i,
            area = 0,
            coordsLength = coords.length;

        var wgs84 = {};
        wgs84.RADIUS = 6378137;
        wgs84.FLATTENING_DENOM = 298.257223563
        wgs84.FLATTENING = 1 / wgs84.FLATTENING_DENOM.FLATTENING_DENOM;
        wgs84.POLAR_RADIUS = wgs84.RADIUS * (1 - wgs84.FLATTENING);

        if (coordsLength > 2) {
            for (i = 0; i < coordsLength; i++) {
                if (i === coordsLength - 2) {// i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength - 1;
                    upperIndex = 0;
                } else if (i === coordsLength - 1) {// i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else { // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i + 1;
                    upperIndex = i + 2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];
                area += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
            }

            area = area * wgs84.RADIUS * wgs84.RADIUS / 2;
        }
        return area;
    }

    function rad(_) {
        return _ * Math.PI / 180;
    }
}

////// БЛОК ГЕОМЕТРИЧЕСКОГО АНАЛИЗА ///////
explication.γεωμετρία.geo_nodes = function (geoJSONel) {
    var nd = [];
    var g = geoJSONel.geometry;
    if (g.type == 'Point') {
        nd.push(g.coordinates);
        return nd;
    }
    if (g.type == 'LineString' || g.type == 'MultiPoint')
        return g.coordinates;
    if (g.type == 'Polygon' || g.type == 'MultiLineString') {
        for (var i in g.coordinates) {
            Array.prototype.push.apply(nd, g.coordinates[i]);
        }
        return nd;
    }
    if (g.type == 'MultiPolygon') {
        for (var i in g.coordinates) {
            var ci = g.coordinates[i];
            for (var j in ci) {
                Array.prototype.push.apply(nd, ci[j]);
            }
        }
        return nd;
    }
    return null;
}

// Блок геометрического анализа из библиотеки https://turfjs.org/docs/
explication.γεωμετρία.booleanPointInPolygon = function (point, polygon, options) {
    function inRing(pt, ring, ignoreBoundary) {
        var isInside = false;
        if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring = ring.slice(0, ring.length - 1);

        for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            var xi = ring[i][0], yi = ring[i][1];
            var xj = ring[j][0], yj = ring[j][1];
            var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) === 0) &&
                ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
            if (onBoundary)
                return !ignoreBoundary;
            var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
                (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
            if (intersect) isInside = !isInside;
        }
        return isInside;
    }
    function getCoord(obj) {
        if (!obj) throw new Error('obj is required');

        var coordinates = getCoords(obj);

        // getCoord() must contain at least two numbers (Point)
        if (coordinates.length > 1 && isNumber(coordinates[0]) && isNumber(coordinates[1])) {
            return coordinates;
        } else {
            throw new Error('Coordinate is not a valid Point');
        }
    }
    function getCoords(obj) {
        if (!obj) throw new Error('obj is required');
        var coordinates;

        // Array of numbers
        if (obj.length) {
            coordinates = obj;

            // Geometry Object
        } else if (obj.coordinates) {
            coordinates = obj.coordinates;

            // Feature
        } else if (obj.geometry && obj.geometry.coordinates) {
            coordinates = obj.geometry.coordinates;
        }
        // Checks if coordinates contains a number
        if (coordinates) {
            containsNumber(coordinates);
            return coordinates;
        }
        throw new Error('No valid coordinates');
    }
    function containsNumber(coordinates) {
        if (coordinates.length > 1 && isNumber(coordinates[0]) && isNumber(coordinates[1])) {
            return true;
        }

        if (Array.isArray(coordinates[0]) && coordinates[0].length) {
            return containsNumber(coordinates[0]);
        }
        throw new Error('coordinates must only contain numbers');
    }

    function isNumber(num) {
        return !isNaN(num) && num !== null && !Array.isArray(num);
    }

    // Optional parameters
    options = options || {};
    if (typeof options !== 'object') throw new Error('options is invalid');
    var ignoreBoundary = options.ignoreBoundary;

    // validation
    if (!point) throw new Error('point is required');
    if (!polygon) throw new Error('polygon is required');

    var pt = getCoord(point);
    var polys = getCoords(polygon);
    var type = (polygon.geometry) ? polygon.geometry.type : polygon.type;
    var bbox = polygon.bbox;

    // Quick elimination if point is not inside bbox
    if (bbox && inBBox(pt, bbox) === false) return false;

    // normalize to multipolygon
    if (type === 'Polygon') polys = [polys];

    for (var i = 0, insidePoly = false; i < polys.length && !insidePoly; i++) {
        // check if it is in the outer ring first
        if (inRing(pt, polys[i][0], ignoreBoundary)) {
            var inHole = false;
            var k = 1;
            // check for the point in any of the holes
            while (k < polys[i].length && !inHole) {
                if (inRing(pt, polys[i][k], !ignoreBoundary)) {
                    inHole = true;
                }
                k++;
            }
            if (!inHole) insidePoly = true;
        }
    }
    return insidePoly;
}

geoAlb_lib = {};

// Три типа ОСМ объектов - теги для разбора, части адреса, необходимость выборки внутренностей и название
geoAlb_lib.osm_tag = ['osm_nd_id', 'osm_w_id', 'osm_rl_id'];
geoAlb_lib.osm_type = ['node', 'way', 'relation'];
geoAlb_lib.osm_suff = ['', 'full', 'full'];
geoAlb_lib.osm_title = ['Точка', 'Линия', 'Отношение'];
// Теги, определяющие, что графический блок имеет географические координаты
geoAlb_lib.geoImageDivTags = ['lon', 'lat', ...geoAlb_lib.osm_tag, 'coordinates', 'flickr_id'/*, 'panoramio_id'*/];

geoAlb_lib.OSM_baseURL = 'https://www.openstreetmap.org'; // Хранилище ОСМ данных здесь
geoAlb_lib.OSM_API_URL = geoAlb_lib.OSM_baseURL + '/api/0.6/' //Выборка объектов отсюда;

// Формирует одрес ОСМ объекта
geoAlb_lib.OSM_URL = function (type, id, suff) {
    var _smod = (suff != '') ? '/' + suff : '';
    return geoAlb_lib.OSM_API_URL + type + '/' + id + _smod;
}

// Получает из документа ветвь отношения с данным кодом
geoAlb_lib.getRelationXmlTree = function (xml, osm_rl_id) {
    var relations = xml.getElementsByTagName('relation');
    for (var i = 0; i < relations.length; i++) {
        if (relations[i].getAttribute('id') == osm_rl_id)
            return relations[i];
    }
    return null;
};

// Удаляет точки из geoJSON отношения или линии
geoAlb_lib.geoJsonRemoveOsmNodes = function (geoJson) {
    for (var i = 0; i < geoJson.features.length; i++) {
        if (geoJson.features[i].geometry.type == 'Point') {
            geoJson.features.splice(i, 1);
            i--;
        }
    }
    return geoJson;
};

// Получает массив номеров отношений, содержащих подчинённые территории
geoAlb_lib.getSubAreas = function (xml, osm_rl_id) {
    var relXml = geoAlb_lib.getRelationXmlTree(xml, osm_rl_id);
    if (!relXml)
        return null;
    var subAreas = [];
    var members = relXml.getElementsByTagName('member');
    var j = 0;
    for (var i = 0; i < members.length; i++) {
        if (members[i].getAttribute('type') == 'relation' && members[i].getAttribute('role') == 'subarea')
            subAreas[j++] = members[i].getAttribute('ref');
    }
    return subAreas;
};

// Удаляет чужие полигоны из документа, оставляя собственный полигон заданного отношения
geoAlb_lib.geoJsonDecomposeSubAreas = function (geoJson, osm_rl_id) {
    var subrel = []; var j = 0;
    for (var i = 0; i < geoJson.features.length; i++) {
        if (geoJson.features[i].geometry.type.indexOf('Polygon') + 1)
            if (geoJson.features[i].id.indexOf('relation/') + 1) {
                if (geoJson.features[i].id != 'relation/' + osm_rl_id) {
                    geoJson.features.splice(i--, 1);
                }
            }
            else // Полигоны от линий удаляем
                geoJson.features.splice(i--, 1);
    }
    return geoJson;
};

// Оставляет собственный полигон заданного отношения
geoAlb_lib.relationSelfPolygon = function (geoJson, osm_rl_id) {
    for (var i = 0; i < geoJson.features.length; i++) {
        if ((geoJson.features[i].geometry.type.indexOf('Polygon') + 1) &&
            (geoJson.features[i].id == 'relation/' + osm_rl_id))
            return i;
    }
    return null;
};

// Создание GeoJson из основного контура отношения, представленного в xml документе
geoAlb_lib.osmRelationGeoJson = function (xml, rel_id) {
    var geoJson0 = osmtogeojson(xml);
    var geoJson1 = geoAlb_lib.geoJsonRemoveOsmNodes(geoJson0);
    var geoJson2 = geoAlb_lib.geoJsonDecomposeSubAreas(geoJson1, rel_id);
    geoJson2.osm_rel_id = rel_id;
    return geoJson2;
};
