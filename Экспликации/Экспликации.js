explication.osm = {
	function_general:  function (geoJsonGeneral, участки, L_mapLayer, L_mapNames) {
		log('Получены исходные данные ');
		var main_rel = explication.main_rel(geoJsonGeneral);
		document.getElementById('obj_title').innerText = main_rel.properties.tags.name;
		var водотоки = [];
		var дорожки = [];
		var обсадки = [];
		var маточные_площадки = [];
		var Ref_arr = [];

		var lGr_водотоки = [];
		var lGr_дорожки = [];
		var lGr_обсадки = [];
		var lGr_маточные_площадки = [];
		var lGr_Ref_arr = [];

	    for (var i in geoJsonGeneral.features) {
	        var osmGeoJSONobj = geoJsonGeneral.features[i];

	        var nd = explication.γεωμετρία.geo_nodes(osmGeoJSONobj);
	        var ok = false;
	        for (var i_n in nd) {
	            ok = ok || (explication.γεωμετρία.booleanPointInPolygon(nd[i_n], main_rel, { ignoreBoundary: true }));
	        }
	        if (ok && explication.osm.filter.Водоток(osmGeoJSONobj)){
				var водоток = explication.osm.data_object.Водоток(osmGeoJSONobj);
				водотоки.push(водоток);
				l_osmGeoJsonData(
					osmGeoJSONobj, 
					explication.osm.geoJSON_style.Водоток(osmGeoJSONobj, водоток),
					водоток,
					lGr_водотоки
				);
			}
			if (ok && explication.osm.filter.Дорожка(osmGeoJSONobj)){
				var дорожка = explication.osm.data_object.Дорожка(osmGeoJSONobj);
				дорожки.push(дорожка);
				l_osmGeoJsonData(
					osmGeoJSONobj, 
					explication.osm.geoJSON_style.Дорожка(osmGeoJSONobj, дорожка),
					дорожка,
					lGr_дорожки
				);
			}
			if (ok && explication.osm.filter.МаточнаяПлощадка(osmGeoJSONobj)){
				var маточная_площадка = explication.osm.data_object.МаточнаяПлощадка(osmGeoJSONobj, участки);
				маточные_площадки.push(маточная_площадка);
				l_osmGeoJsonData(
					osmGeoJSONobj, 
					explication.osm.geoJSON_style.МаточнаяПлощадка(osmGeoJSONobj, маточная_площадка),
					маточная_площадка,
					lGr_маточные_площадки
				);
			}
			if (ok && osmGeoJSONobj.properties.tags['ref:sirius_msk']){
				var ref_o = explication.osm.data_object.Ref_Sirius_msk(osmGeoJSONobj);
				Ref_arr.push(ref_o);
				l_osmGeoJsonData(
					osmGeoJSONobj, 
					explication.osm.geoJSON_style.Ref_sirius_msk(osmGeoJSONobj, ref_o),
					ref_o,
					lGr_Ref_arr
				);			
			}
			if (ok && explication.osm.filter.Обсадка(osmGeoJSONobj)){
				var обсадка = explication.osm.data_object.Обсадка(osmGeoJSONobj);
				обсадки.push(обсадка);
				l_osmGeoJsonData(
					osmGeoJSONobj, 
					explication.osm.geoJSON_style.Обсадка(osmGeoJSONobj, обсадка),
					обсадка,
					lGr_обсадки
				);			
			}
		}
		водотоки.sort(explication.osm.sort.Водоток);
		дорожки.sort(explication.osm.sort.Дорожка);
		обсадки.sort(explication.osm.sort.Обсадка);
		маточные_площадки.sort(explication.osm.sort.МаточнаяПлощадка);
		Ref_arr.sort(explication.osm.sort.Ref_Sirius_msk);

		function No_ (data_obj){
			for (var i in data_obj) {
		    	data_obj[i].No = Number(i) + 1;
			}
		}
		
		No_(водотоки);
		No_(дорожки);
		No_(обсадки);
		No_(маточные_площадки);
		No_(Ref_arr);


		document.getElementById('водотоки').appendChild(explication.tabulation(водотоки));
		document.getElementById('дорожки').appendChild(explication.tabulation(дорожки));
		document.getElementById('обсадки').appendChild(explication.tabulation(обсадки));
		document.getElementById('маточные_площадки').appendChild(explication.tabulation(маточные_площадки));			
		document.getElementById('ref_sirius_msk').appendChild(explication.tabulation(Ref_arr));		
		
		log('Экспликация показана ');
		document.getElementById('status').innerText = '';
		var t1 = new Date().getTime();
		document.getElementById('note').innerText = 'Сформировано за ' + (t1 - t0) / 1000 + ' сек.';

		var md = explication.map(
			document.getElementById('map'),
			geoJsonGeneral,				
			{
				tileLayers:	L_mapLayer,
				Names: L_mapNames
			}
		);

		md.Control.addOverlay(new L.LayerGroup(lGr_обсадки), "Обсадки");
		md.Control.addOverlay(new L.LayerGroup(lGr_дорожки), "Дорожки");
		md.Control.addOverlay(new L.LayerGroup(lGr_маточные_площадки), "Маточные площадки");
		md.Control.addOverlay(new L.LayerGroup(lGr_водотоки), "Водотоки");
		md.Control.addOverlay(new L.LayerGroup(lGr_Ref_arr), "С кодом фотосайта Московские Парки");
		md.Control.expand();

		explication.osm.сверка_маточных_площадок(маточные_площадки);
	}, // Конец основной алгоритмической ветви
    filter: { // Фильтры, отбирающие объект на основе разметки ОСМ
		Водоток: function (osmGeoJSON_obj) {
			var t = osmGeoJSON_obj.properties.tags;
			var nt = t['natural'];
			var ww = t['waterway'];
			var am = t['amenity'];
			if (!ww && nt != 'water' && nt != 'spring' && am != 'fountain')
			    return false;
			if (ww == 'dam')
			    return false;
			return true;
		},
		Дорожка: function (osmGeoJSON_obj) {
			var t = osmGeoJSON_obj.properties.tags;
			var hw = t['highway'];
			if (['path', 'footway', 'footpath', 'service', 'track', 'steps', 'pedestrian'].indexOf(hw) < 0 )
			    return false;
			return true;
		},
		МаточнаяПлощадка: function (osmGeoJSON_obj) {
			var t = osmGeoJSON_obj.properties.tags;
			var ref = t['ref'];
			if (!ref)
			    return false;
			if (ref.indexOf(':') < 0 && ref.indexOf('*') < 0 && ref.length > 2)
			    return false;
			var bar = t['barrier'];
			if (bar == 'gate')
			    return false;
			return true;
		},
		ДатированныйОбъект: function (osmGeoJSON_obj) {
			var t = osmGeoJSON_obj.properties.tags;
			if (!t['start_date'])
			    return false;
			return true;
		},
		Ref_Sirius_msk: function (osmGeoJSON_obj) {
			var t = osmGeoJSON_obj.properties.tags;
			if (!t['ref:sirius_msk'])
			    return false;
			return true;
		},
		Обсадка: function (osmGeoJSON_obj) {
			var t = osmGeoJSON_obj.properties.tags;
		    return t['natural'] == 'tree_row';
		}
    },
    data_object: { // Формирователи объектов экспликациии из разметки ОСМ по каждому объекту
		Водоток: function (osmGeoJSON_obj) {
			var nd = explication.γεωμετρία.geo_nodes(osmGeoJSON_obj);
			var t = osmGeoJSON_obj.properties.tags;
	
			var nt = t['natural'];
			var ww = t['waterway'];
			var am = t['amenity'];
			var note = t['note'];
			var start = t['start_date'];
			var descr = t['description'];
			if (nt == 'water')
			    ww = 'pond';
			if (nt == 'spring')
			    ww = 'spring';
			if (am == 'fountain')
			    ww = 'fountain';
	
			var wt = explication.osm.data.water[ww];
			var n = t['name'];
			n = n ? n : t['alt_name'];
			n = n ? n : t['local_name'];
			n = n ? n : '';
			var wd = t['width'];
			wd = wd ? wd : '';
			var mt_len = explication.γεωμετρία.len(osmGeoJSON_obj.geometry);
			var sq = explication.γεωμετρία.sqf(osmGeoJSON_obj.geometry);
			sq = sq ? '≈' + sq.toFixed(1) + 'м²' : '';
	
			var Уч_geoJSON = explication.osm.γεωμετρία.Участок_массива_точек(nd);
			var Уч_ = '';
			for (var j in Уч_geoJSON) {
			    Уч_ += ' ' + Уч_geoJSON[j].properties.tags.name;
			}
			var osmt = osmGeoJSON_obj.properties.type[0];
			var osmt_ = (osmt == 'n') ? 'Точка' : ((osmt == 'w') ? 'Линия' : 'Отношение');
			var водоток = {
			    No: null,
			    Название: n,
			    Другое_название: t['alt_name'] ? t['alt_name'] : '',
			    Местное: t['local_name'] ? t['local_name'] : '',
			    Тип: wt,
			    Пересыхает: t['intermittent'] ? 'Есть' : 'Нет',
			    Сезонность: t['seasonal'] ? 'Есть' : 'Нет',
			    Расположение: t['tunnel'] ? 'Подземный' : 'Наземный',
			    Длина_части: mt_len ? '≈' + mt_len.toFixed(1) + 'м' : '',
			    Ширина: wd,
			    Площадь: sq,
			    Заметки: note ? note : null,
			    Датировка: start ? start : '',
			    Описание: descr ? descr : '',
			    Объект_OSM : "<a href='https://www.openstreetmap.org/" + osmGeoJSON_obj.id + "'>" + osmt_ + "</a>",
			    _Участки: Уч_geoJSON ? Уч_ : null,
			    _geoJSON_Участков: Уч_geoJSON,
			    _nd: null
			};
			водоток._tooltip = водоток.Название ? водоток.Название : водоток.Местное ? водоток.Местное : водоток.Другое_название ? водоток.Другое_название : '';
			водоток._popup = explication.osm.popup(водоток, '<b>Учётная карточка водотока</b></br><i>№ в таблице экспликации</i> ');
			return водоток;
		},
		Дорожка: function (osmGeoJSON_obj) {
			var nd = explication.γεωμετρία.geo_nodes(osmGeoJSON_obj);
			var t = osmGeoJSON_obj.properties.tags;
	
			var hw = t['highway'];
			var hs = t['surface'];
			var ht = explication.osm.data.highway[hw];
			var hst = '';
			if (hs)
			    hst = explication.osm.data.surface[hs];
			hst = hst ? hst : hs;
			var n = t['name'];
			n = n ? n : '';
			var an = t['alt_name'];
			an = an ? an : '';
			var ln = t['local_name'];
			ln = ln ? ln : '';
	
			var wd = t['width'];
			wd = wd ? wd : '';
	
			var note = t['note'];
			var start = t['start_date'];
			var descr = t['description'];
			var mt_len = explication.γεωμετρία.len(osmGeoJSON_obj.geometry);
	
			var Уч_geoJSON = explication.osm.γεωμετρία.Участок_массива_точек(nd);
			var Уч_ = '';
	
			function norm(v) {
			    return ('00' + v).slice(-2);
			}
			for (var j in Уч_geoJSON) {
			    Уч_ += norm(Уч_geoJSON[j].properties.tags.name);
			}
	
			var osmt = osmGeoJSON_obj.properties.type[0];
			var osmt_ = (osmt == 'n') ? 'Точка' : ((osmt == 'w') ? 'Линия' : 'Отношение');
			var дорожка = {
			    No: null,
			    Название: n,
			    Другое_название: an,
			    Местное: ln,
			    Тип: ht,
			    Покрытие: hst ? hst : '',
			    Длина_части: mt_len ? '≈' + mt_len.toFixed(1) + 'м' : '',
			    Ширина: wd,
			    Мост: t['bridge'] ? 'Да' : '',
			    Заметки: note ? note : null,
			    Датировка: start ? start : '',
			    Описание: descr ? descr : '',
			    Объект_OSM : "<a href='https://www.openstreetmap.org/" + osmGeoJSON_obj.id + "'>" + osmt_ + "</a>",
			    _Участки: Уч_geoJSON ? Уч_ : null	
			};
		    дорожка._tooltip = дорожка.Название ? дорожка.Название : дорожка.Местное ? дорожка.Местное : дорожка.Другое_название ? дорожка.Другое_название : '';
		    дорожка._popup = explication.osm.popup(дорожка, '<b>Учётная карточка элемента</br>дорожно-тропиночной сети</b></br><i>№ в таблице экспликации</i> ');
			return дорожка;
		},
		МаточнаяПлощадка: function (osmGeoJSON_obj, участки) {
			var nd = explication.γεωμετρία.geo_nodes(osmGeoJSON_obj);
			var t = osmGeoJSON_obj.properties.tags;

			var ref = t['ref'];
			var nt = t['natural'];
			if (t['barrier'] == 'hedge')
			    nt = 'scurb';
			var bio_lat = explication.osm.biolog_format({
			    genus: t['genus'],
			    spieces: t['spieces'],
			    taxon: t['taxon'] ? t['taxon'] : t['was:taxon']
			});
			var bio_rus = explication.osm.biolog_format({
			    genus: t['genus:ru'],
			    spieces: t['spieces:ru'],
			    taxon: t['taxon:ru'] ? t['taxon:ru'] : t['was:taxon:ru']
			});
			var rs = ref.split(":");
			var ref_n = rs[rs.length - 1];
			var note = t['note'];
			var start = t['start_date'];
			var descr = t['description'];
			var lc = t['leaf_cycle'];
			var lt = t['leaf_type'];
			lc = lc ? lc : null;
			lt = lt ? lt : null;
			nt = nt ? nt : null;
			var fm = t['fixme'];
			fm = fm ? fm : null;
			var sq = explication.γεωμετρία.sqf(osmGeoJSON_obj.geometry);
			sq = sq ? '≈' + sq.toFixed(1) + 'м²' : '';
			var Уч_geoJSON = explication.osm.γεωμετρία.Участок_всех_точек(nd, участки);
	
			function norm(v) {
			    return ('00' + v).slice(-2);
			}
			var osmt = osmGeoJSON_obj.properties.type[0];
			var osmt_ = (osmt == 'n') ? 'Точка' : ((osmt == 'w') ? 'Линия' : 'Отношение');
			var маточная_площадка = {
			    No: null,
			    Участок: Уч_geoJSON ? Уч_geoJSON.properties.tags.name : null,
			    Год_учёта: rs.length > 1 ? rs[0] : '',
			    Номер_площадки: ref_n,
			    Род: bio_rus[0].genus ? bio_rus[0].genus : '',
			    Вид: bio_rus[0].spieces ? bio_rus[0].spieces.join(' ') : '',
			    Genus: bio_lat[0].genus ? bio_lat[0].genus : '',
			    Spieces: bio_lat[0].spieces ? bio_lat[0].spieces.join(' ') : '',
			    Род2: bio_rus[1] ? bio_rus[1].genus : '',
			    Вид2: bio_rus[1] ? bio_rus[1].spieces.join(' ') : '',
			    Genus2: bio_lat[1] ? bio_lat[1].genus : '',
			    Spieces2: bio_lat[1] ? bio_lat[1].spieces.join(' ') : '',
			    Тип: explication.osm.data.natural[nt],
			    Сезонность: explication.osm.data.leaf_cycle[lc].ru,
			    Листва: explication.osm.data.leaf_type[lt].ru,
			    Площадь: sq,
			    Заметки: note ? note : null,
			    Датировка: start ? start : '',
			    Описание: descr ? descr : '',
			    Вырублен: t['was:taxon'] ? '<span style="color: red"><b>Да</b></span>' : 'Нет',
			    Нужно_доработать: fm ? '<span style="color: red">' + fm + '</span>' : null,
			    Объект_OSM : "<a href='https://www.openstreetmap.org/" + osmGeoJSON_obj.id + "'>" + osmt_ + "</a>",
			    _Участок: Уч_geoJSON ? norm(Уч_geoJSON.properties.tags.name) : null,
			    _Код: norm(ref_n),
			    _geoJSON_Участка: Уч_geoJSON,
			    _nd: nd
			};
			    // маточная_площадка.На_Моск_Парках = "<a href='http://moscowparks.narod.ru/piptsar/birdend/" + мато	чная_площадка._Участок + "/" + norm(маточная_площадка.Номер_площадки.replace('*', '')) + ".htm'> площадка №" + мато	чная_площадка.Номер_площадки + "</a>";
			    if (маточная_площадка._geoJSON_Участка) {
			        маточная_площадка._tooltip = маточная_площадка.Участок + "×" + маточная_площадка.Номер_площадки + (маточная_площадка.Род ? (' : ' + маточная_площадка.Род + ' ' + маточная_площадка.Вид) : '');
	
			        маточная_площадка._popup = explication.osm.popup(маточная_площадка, '<b>Учётная карточка</br>маточной площадки</b></br><i>№ в таблице экспликации</i> ');
			        //var УчМоскПарки = "<a href='http://moscowparks.narod.ru/piptsar/birdend/" + маточная_площадка._Участок + "/'>Моск.Парки</a>";
			        var УчOSM = "<a href='https://www.openstreetmap.org/" + маточная_площадка._geoJSON_Участка.id + "'>osm</a>";
			        // маточная_площадка.Участок += ' <small>' + УчМоскПарки + " " + УчOSM + "</small>";
			        //   маточная_площадка.Номер_площадки = маточная_площадка.На_Моск_Парках.replace('площадка №', '');
			        //   delete маточная_площадка.На_Моск_Парках;
			    }
			return маточная_площадка;
		},
		ДатированныйОбъект: function (osmGeoJSON_obj) {
			return {};
		},
		Ref_Sirius_msk: function (osmGeoJSON_obj) {
			// var nd = explication.γεωμετρία.geo_nodes(osmGeoJSON_obj);
			var t = osmGeoJSON_obj.properties.tags;
		
			var mt_len = explication.γεωμετρία.len(osmGeoJSON_obj.geometry);
			var osmt = osmGeoJSON_obj.properties.type[0];
			var osmt_ = (osmt == 'n') ? 'Точка' : ((osmt == 'w') ? 'Линия' : 'Отношение');
			var ref_obj = {
			    No: null,
			    Обозначение: t['ref:sirius_msk'],
			    Название: t['name'] ? t['name'] : '',
			    Длина_части: mt_len,
			    Объект_OSM : "<a href='https://www.openstreetmap.org/" + osmGeoJSON_obj.id + "'>" + osmt_ + "</a>",
			    _nd: null
			};
			ref_obj._tooltip = "«Московские парки» : " + ref_obj.Обозначение;
		    ref_obj._popup = explication.osm.popup(ref_obj, '<b>Карточка объекта, имеющего</br>обозначение фотосайта «Московские парки»</b></br><i>№ в таблице экспликации</i> ');
			return ref_obj;
		},
		Обсадка: function (osmGeoJSON_obj) {
			// var nd = explication.γεωμετρία.geo_nodes(osmGeoJSON_obj);
			var t = osmGeoJSON_obj.properties.tags;
		
			var mt_len = explication.γεωμετρία.len(osmGeoJSON_obj.geometry);
			var osmt = osmGeoJSON_obj.properties.type[0];
			var osmt_ = (osmt == 'n') ? 'Точка' : ((osmt == 'w') ? 'Линия' : 'Отношение');
			var bio_rus = explication.osm.biolog_format({
			    genus: t['genus:ru'],
		    	spieces: t['spieces:ru'],
		    	taxon: t['taxon:ru'] ? t['taxon:ru'] : t['was:taxon:ru']
			});
			var bio_lat = explication.osm.biolog_format({
			    genus: t['genus'],
			    spieces: t['spieces'],
			    taxon: t['taxon'] ? t['taxon'] : t['was:taxon']
			});
			var обсадка = {
			    No: null,
			    Род: bio_rus[0].genus ? bio_rus[0].genus : bio_lat[0].genus ? bio_lat[0].genus : '',
			    Вид: bio_rus[0].spieces ? bio_rus[0].spieces.join(' ') : bio_lat[0].spieces ? bio_lat[0].spieces : '',
			    Длина_части: mt_len,
			    Объект_OSM : "<a href='https://www.openstreetmap.org/" + osmGeoJSON_obj.id + "'>" + osmt_ + "</a>",
			    _nd: null
			};
			обсадка._tooltip = обсадка.Род + ' ' + обсадка.Вид;
   			обсадка._popup = explication.osm.popup(обсадка, '<b>Карточка обсадки</b></br><i>№ в таблице экспликации</i> ');
			return обсадка;
		}
    },
    data: { // Данные для пояснения свойств и оформления объектов ОСМ
		leaf_type: {
			broadleaved: {
			    ru: 'Широколиственная',
			    color: '#8DB600'
			},
			needleleaved: {
			    ru: 'Хвойная',
			    color: '#397262'
			},
			mixed: {
			    ru: 'Смешанный',
			    color: '#888888'
			},
			leafless: {
			    ru: 'Безлистная',
			    color: '#000000'
			},
			null: {
			    ru: '?',
			    color: '#ffff00'
			}
		},
		leaf_cycle: {
			evergreen: {
			    ru: 'Вечнозелёные',
			    color: '#397262'
			},
			deciduous: {
			    ru: 'Листопадные',
			    color: '#8DB600'
			},
			semi_evergreen: {
			    ru: 'Полулистопадные',
			    color: '#00ffa0'
			},
			semi_deciduous: {
			    ru: 'С коротким безлиственным периодом',
			    color: '#476300'
			},
			mixed: {
			    ru: 'смешанные',
			    color: '#888888'
			},
			null: {
			    ru: '?',
			    color: '#ffff00'
			}
		},
		natural: {
			wood: 'Древесная посадка',
			tree: 'Отдельное дерево',
			tree_row: 'Ряд деревьев',
			scrub: 'Кусты',
			null: '?'
		},
		water: {
			spring: 'Родник',
			pond: 'Водная гладь',
			river: 'Речка',
			stream: 'Ручей',
			drain: 'Сток',
			ditch: 'Канава',
			waterfall: 'Водопад',
			weir: 'Плотина',
			riverbank: 'Большая река',
			fountain: 'Фонтан',
			null: '?'
		},
		highway: {
			path: 'Тропинка',
			footway: 'Дорожка',
			footpath: 'Дорожка',
			service: 'Проезжая дорога',
			track: 'Парковая дорога',
			steps: 'Лестница',
			pedestrian: 'Пешеходная улица',
			null: '?'
		},
		surface: {
			dirt: 'Грязь',
			ground: 'Земля',
			unpaved: 'Земля',
			compacted: 'Утрамбовано',
			tiles: 'Плитка',
			paving_stones: 'Мощение',
			asphalt: 'Асфальт',
			gravel: 'Гравий',
			paved: 'Твёрдое',
			wood: 'Дерево',
			pebblestone: 'Галька',
			fine_gravel: 'Камнегравийный слой',
			grass: 'Трава',
			null: ''
		},
		surface_color: {
			dirt: '#9b7653',
			ground: '#9b76ff',
			compacted: '#442d25',
			tiles: '#303030',
			paving_stones: '#774444',
			asphalt: '#444444',
			gravel: 'yellow',
			paved: '#111111',
			wood: '#0a5F38',
			pebblestone: '#888888',
			fine_gravel: '#f8f32b',
			grass: '#8DB600',
			null: 'red'
		}
    },
    geoJSON_style: {
		Водоток: function (osmGeoJSONobj, вт) {
			var S = {};
			if (вт.Тип == 'Речка')
			    S.weight = 4;
			else if (вт.Тип == 'Водопад')
			    S.weight = 4;
			else if (вт.Тип == 'Ручей')
			    S.weight = 3;
			else if (вт.Тип == 'Сток')
			    S.weight = 2;
			else if (вт.Тип == 'Канава')
			    S.weight = 3;
			else if (вт.Тип == '?')
			    S.weight = 2;
			else
			    S.weight = 1;
			if (osmGeoJSONobj.properties.tags.tunnel && osmGeoJSONobj.properties.tags.tunnel != 'no')
			    S.dashArray = '4, 4';
			return S;
		},
		Дорожка: function (osmGeoJSONobj, др) {
			var S = {};
			if (др.Тип == 'Тропинка')
			    S.weight = 2;
			else if (др.Тип == 'Дорожка')
			    S.weight = 3;
			else if (др.Тип == 'Проезжая дорога')
			    S.weight = 5;
			else if (др.Тип == 'Парковая дорога')
			    S.weight = 4;
			else if (др.Тип == '?')
			    S.weight = 4;
			else if (др.Тип == 'Лестница')
			    S.weight = 4;
			else
			    S.weight = 1;
	
			var hs = osmGeoJSONobj.properties.tags['surface'];
			if (explication.osm.data.surface_color[hs])
			    S.color = explication.osm.data.surface_color[hs];
			else
			    S.color = 'white';
			return S;
		},
		МаточнаяПлощадка: function (osmGeoJSONobj, маточная_площадка) {
			var S = {};
			if (маточная_площадка.Тип == 'Кусты')
			    S.weight = 1;
			else if (маточная_площадка.Тип == '?')
			    S.weight = 2;
			else
			    S.weight = 2;
	
			var lc = osmGeoJSONobj.properties.tags['leaf_cycle'];
			var lt = osmGeoJSONobj.properties.tags['leaf_type'];
			if (explication.osm.data.leaf_type[lt])
			    S.color = explication.osm.data.leaf_type[lt].color;
			else
			    S.color = "#888888";
			if (explication.osm.data.leaf_cycle[lc])
			    S.fillColor = explication.osm.data.leaf_cycle[lc].color;
			else
			    S.fillColor = "#888888";
			S.fillOpacity = 0.2;
			return S;
		},
		ДатированныйОбъект: function (osmGeoJSON_obj) {

		},
		Ref_sirius_msk: function (osmGeoJSON_obj) {
		return {};
		},
		Обсадка: function (osmGeoJSON_obj) {
		    return { weight: 1, color: '#00FF00' };
		}
	},
    popup: function (obj, title) {  // Возвращает гипертекст учётной карточки
		var html = '<p align="center">' + title + '<a href="#' + obj.No + '">' + obj.No + '</a></p><table><tr><th>Свойство</th><th>Значение</th></tr>';
		for (var k in obj) {
		if (k[0] == '_' || k == 'No' || !obj[k] || obj[k] == '?' || obj[k] == '-')
		    continue;
		html += '<tr><td>' + k.replace('_', ' ').replace('_', ' ') + '</td><td>' + obj[k] + '</td></tr>';
		}
		html += '</table>';
		return html;
    },
    biolog_format: function (bio) { // Получает каноническое разложение полей классификации
		if (!bio.taxon) {
		return [{ genus: bio.genus, taxon: null, spieces: bio.spieces }];
		}
		var a = bio.taxon.split(';');
		canon = [];
		for (var ti in a) {
		gt = bio.genus ? bio.genus.split(';')[ti] : null;
		st = bio.spieces ? bio.spieces.split(';')[ti] : null;
		tt = a[ti] ? a[ti].split(' ') : null;
		canon.push({
		    genus: gt ? gt : a[ti].split(' ')[0],
		    spieces: st ? st : tt.slice(1, tt.length)
		});
		}
		return canon;
    },
    sort: {
		Водоток: function (a, b) {
			if (a.Название === b.Название) {
			    return 0;
			}
			else if (!a.Название) {
			    return 1;
			}
			else if (!b.Название) {
			    return -1;
			}
			else {
			    return (a.Название < b.Название) ? -1 : 1;
			}
		},
		Дорожка: function (a, b) {
			if (a.Название === b.Название) {
			    return 0;
			}
			else if (!a.Название) {
			    return 1;
			}
			else if (!b.Название) {
			    return -1;
			}
			else {
			    return (a.Название < b.Название) ? -1 : 1;
			}
		},
		МаточнаяПлощадка: function (a, b) {
			function norm(v) {
			    return ('00' + v).slice(-2);
			}
			function knorm(v) {
			    return norm(v.replace('*', ''));
			}
			var ka = knorm(a._Код);
			var kb = knorm(b._Код);
			if (a._Участок < b._Участок) return -1;
			if (a._Участок > b._Участок) return 1;
			if (ka < kb) return -1;
			if (ka > kb) return 1;
			return 0;
		},
		ДатированныйОбъект: function (a, b) {
		},
		Ref_Sirius_msk: function (a, b) {
			function norm(v) {
			    return v ? ('000' + v).slice(-3): v;
			}
			var a_ = norm(a.Обозначение);
			var b_ = norm(b.Обозначение);
			if ( a_ === b_) {
			    return 0;
			}
			else if (!a_) {
			    return 1;
			}
			else if (!b_) {
			    return -1;
			}
			else {
			    return (a_ < b_) ? -1 : 1;
			}
		}
    },
    γεωμετρία: {
		Участок_массива_точек: function (nd, участки) { // Определяет участки, которые захватывает массив точек
		var cand = [];
		for (var i_u in участки) {
		    var pol = участки[i_u];
		    for (var i_n in nd) {
		        if (explication.γεωμετρία.booleanPointInPolygon(nd[i_n], pol, { ignoreBoundary: true })) {
		            cand.push(pol);
		        }
		    }
		}
		return cand.filter((item, pos, arr) => !pos || item !== arr[pos - 1]); // Массив участков
		},
		Участок_всех_точек: function (nd, участки) {
		var cand = [];
		for (var i_u in участки) {
		    var pol = участки[i_u];
		    for (var i_n in nd) {
		        if (explication.γεωμετρία.booleanPointInPolygon(nd[i_n], pol, { ignoreBoundary: true })) {
		            cand.push(pol);
		        }
		    }
		} // Наден перечень участков, которым принадлежат точки данного объекта
		cand = cand.filter(function (item, pos) { return cand.indexOf(item) == pos; });
		if (cand.length == 0) // Нет точек ни в одном участке
		    return null;
		if (cand.length == 1)
		    return cand[0];
		for (var c in cand) {
		    var ok = true;
		    for (var i_n in nd) {
		        ok = ok && (explication.γεωμετρία.booleanPointInPolygon(nd[i_n], cand[c], { ignoreBoundary: true }));
		    }
		    if (ok)
		        return cand[c]; // Первый Участок, к которому относятся все точки
		}
		}
    }, // γεωμετρία
	сверка_маточных_площадок: function (маточные_площадки) {
		var xhr = new XMLHttpRequest();
		xhr.url = 'https://raw.githubusercontent.com/mkgrgis/mkgrgis/master/Экспликации/МаточныеПлощадкиБД.txt';
		xhr.open('GET', xhr.url, true);
		xhr.маточные_площадки = маточные_площадки;
		xhr.send();
		xhr.onreadystatechange = function () {
			if (xhr.readyState != 4) return;
			if (xhr.status != 200 && (xhr.status != 0 || xhr.response)) {
				alert("Ошибка! " + xhr.url);
			} else {
				log('Текстовая экспликация получена');
				var tn = xhr.responseText.split('\r').join('').split('\n');
				var мп0 = [];
				for (var i in tn) {
					if (tn[i].indexOf('×') < 0)
						continue;
					var t0 = tn[i].split('\t');
					if (!t0[1])
						continue;
					var g = t0[1].split(' ')[0];
					var мп = {
						Участок: t0[0].split('×')[0],
						Код: t0[0].split('×')[1],
						Род: (g == '?') ? null : g.replace(',', ''),
						Вид: (t0[1] == '?') ? null : t0[1].split(' ')[1].split(',').join('')
					};
					мп0.push(мп);
				}
				console.log('Расхождения экспликаций');
				var мп1 = xhr.маточные_площадки;
				var diff = [];
				for (var i in мп1) {
					var e1 = мп1[i];
					for (var j in мп0) {
						var e0 = мп0[j];
						if (e0.Участок == e1.Участок && e0.Код == e1._Код) {
							var e2 = Object.assign(e0);
							e2.опознан_род = (e1.Род && e0.Род && e1.Род.toLowerCase().indexOf(e0.Род.toLowerCase()) >= 0);
							e2.url = e1.Объект_OSM;
							if (e0.Род && e1.Род && e0.Род != e1.Род)
								diff.push(e2);
						}
					}
				}
				console.table(diff);
			}
		}
	}
}
