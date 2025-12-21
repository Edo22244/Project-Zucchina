//mappa, di maplibre molto fika 
  const map = new maplibregl.Map({
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [9.100, 50.0],
    zoom: 9.5,
    container: 'map', 

  })
    // tastini altolocati e moderni in alto a destra per zoom e navigazione 
    map.addControl(new maplibregl.NavigationControl({
        visualizePitch: true,
        visualizeRoll: true,
        showZoom: true,
        showCompass: true
    })); 

     const distanceContainer = document.getElementById('distance');

    // GeoJSON oggetto per racchiudere i cazzo di dati delle misure 
    const geojson = {
        'type': 'FeatureCollection',
        'features': []
    };

    //  per selezionare ad un punto all'altro 
    const linestring = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': []
        }
    };

    map.on('load', () => {
        map.addSource('geojson', {
            'type': 'geojson',
            'data': geojson
        });

        //  aggiunge stile alla mappa 
        map.addLayer({
            id: 'measure-points',
            type: 'circle',
            source: 'geojson',
            paint: {
                'circle-radius': 5,
                'circle-color': '#000'
            },
            filter: ['in', '$type', 'Point']
        });
        //divide in due layer la mappa, la lineaa praticamente sta nel layer sopra 
        map.addLayer({
            id: 'measure-lines',
            type: 'line',
            source: 'geojson',
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': '#000',
                'line-width': 2.5
            },
            filter: ['in', '$type', 'LineString']
        });
          // qua 
        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['measure-points']
            });

            // Remove the linestring from the group
            // So we can redraw it based on the points collection
            if (geojson.features.length > 1) geojson.features.pop();

            // Clear the Distance container to populate it with a new value
            distanceContainer.innerHTML = '';

            // se riclicki un punto lo toglie 
            if (features.length) {
                const id = features[0].properties.id;
                geojson.features = geojson.features.filter((point) => {
                    return point.properties.id !== id;
                });
            } else {
                const point = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [e.lngLat.lng, e.lngLat.lat]
                    },
                    'properties': {
                        'id': String(new Date().getTime())
                    }
                };

                geojson.features.push(point);
            }
               //restituisce le coordinate del punto teoricamente, ma non so se funziona 
            if (geojson.features.length > 1) {
                linestring.geometry.coordinates = geojson.features.map(
                    (point) => {
                        return point.geometry.coordinates;
                    }
                );

                geojson.features.push(linestring);

                //  mette nel container distanceContainer la distanza 
                const value = document.createElement('pre');
                value.textContent =
                    `Total distance: ${
                        turf.length(linestring).toLocaleString()
                    }km`;
                distanceContainer.appendChild(value);
            }

            map.getSource('geojson').setData(geojson);
        });
    });

    map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
        });
        // UI indicator for clicking/hovering a point on the map  indicatore UI per cambiare il cursore quando hoveri o clicki 
        map.getCanvas().style.cursor = features.length ?
            'pointer' :
            'crosshair';
    });
    
    map.on('style.load', () => {
        map.setProjection({
            type: 'globe', // questo rende la mappa un globo, sinceramente pensavo sarebbe stato piu diffcile ma sono letteralmente 4 linee di codice e anche molto easy da scrivere
        });
    });

    // To stay consistent with web mercator maps, globe is automatically enlarged when map center is nearing the poles. 
    // This keeps the map center visually similar to a mercator map with the same x,y and zoom.
    // However, sometimes we want to negate this effect and keep the globe size consistent even when changing latitudes.
    // This function computes what we need to add the the target zoom level when changing latitude.  
    function getZoomAdjustment(oldLatitude, newLatitude) {
        return Math.log2(Math.cos(newLatitude / 180 * Math.PI) / Math.cos(oldLatitude / 180 * Math.PI));
    }

    // per zoomare in e out 
    let zoomIn = false;
    const zoomDelta = 1.5;

    document.getElementById('fly').addEventListener('click', () => {
        // questa Ã¨ una funzione copiata e incollata per volare in un posto randomico offsettando la posizione di -74 e qualcos'altro, possiamo modificarla per gestire i viaggi aerei 
      
        const center = [
            map.getCenter().lng,
            zoomIn ? 0 : 80,
        ];
        const mapZoom = map.getZoom();
        const delta = (zoomIn ? zoomDelta : -zoomDelta);
        // We want to change the map's globe size by some delta and change the center latitude at the same time,
        // thus we need to compensate for the globe enlarging effect described earlier.
        const zoom = map.getZoom() + delta + getZoomAdjustment(map.getCenter().lat, center[1]);
        map.flyTo({
            center,
            zoom,
            essential: true // this animation is considered essential with respect to prefers-reduced-motion   
        });
        zoomIn = !zoomIn;
    });
    //I COMMENTI IN INGLESE LI HO LASCIATI PERCHE LI REPUTO IMPORTANTI E NON RIASSUMIBILI