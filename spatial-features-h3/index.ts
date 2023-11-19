import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {H3TileLayer, h3QuerySource, BASEMAP, colorBins} from '@deck.gl/carto';

const cartoConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  accessToken: import.meta.env.VITE_API_ACCESS_TOKEN,
  connectionName: ''
};

const INITIAL_VIEW_STATE = {
  latitude: 40.7128, // Aproximado para Nueva York
  longitude: -74.006, // Aproximado para Nueva York
  zoom: 10,
  pitch: 0,
  bearing: 0,
  minZoom: 3.5,
  maxZoom: 15
};

// Selectors
let selectedVariable = 'population';
let from = 0;
let to = 100000;

const variableSelector = document.getElementById('variable') as HTMLSelectElement;
variableSelector?.addEventListener('change', () => {
  selectedVariable = variableSelector.value;
  render();
});

const fromSelector = document.getElementById('from') as HTMLSelectElement;
fromSelector?.addEventListener('change', () => {
  from = parseInt(fromSelector.value);
});

const toSelector = document.getElementById('to') as HTMLSelectElement;
toSelector?.addEventListener('change', () => {
  to = parseInt(toSelector.value);
});

const applyButton = document.getElementById('apply-filters') as HTMLButtonElement;
applyButton?.addEventListener('click', () => {
  render();
});

function render() {
  const source = h3QuerySource({
    ...cartoConfig,
    aggregationExp: `SUM(${selectedVariable}) as value`,
    sqlQuery: `SELECT * FROM cartobq.public_account.derived_spatialfeatures_usa_h3int_res8_v1_yearly_v2 WHERE ${selectedVariable} between @from and @to`,
    queryParameters: {from, to}
  });

  const layers = [
    new H3TileLayer({
      id: 'h3_layer',
      data: source,
      opacity: 0.8,
      pickable: true,
      extruded: false,
      getFillColor: colorBins({
        attr: 'value',
        domain: [0, 0.34, 1.98, 2.26, 10, 43303],
        colors: 'PinkYl'
      }),
      lineWidthMinPixels: 0.5,
      getLineWidth: 0.5,
      getLineColor: [255, 255, 255, 100],
    })
  ];

  deck.setProps({
    layers,
    getTooltip: ({object}) =>  object && {
        html: `Hex ID: ${object.id}</br>${selectedVariable.toUpperCase()}: ${parseInt(object.properties.value)}`
      }
  });
}

// Main execution
const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP.DARK_MATTER,
  interactive: false
});

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: INITIAL_VIEW_STATE,
  controller: true,
});
deck.setProps({
  onViewStateChange: ({viewState}) => {
    const {longitude, latitude, ...rest} = viewState;
    map
    .jumpTo({center: [longitude, latitude], ...rest});
  }
});

render();
