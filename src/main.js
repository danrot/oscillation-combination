import xs from 'xstream';
import { run }  from '@cycle/xstream-run';
import { makeDOMDriver, div, h1 } from '@cycle/dom';
import List from './List';

function main(sources) {
  return List(sources);
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

run(main, drivers);
