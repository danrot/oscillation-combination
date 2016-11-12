import xs from 'xstream';
import { run }  from '@cycle/xstream-run';
import { makeDOMDriver, div, h1 } from '@cycle/dom';
import List from './List';
import WebAudioDriver from './WebAudioDriver';

function main(sources) {
  return List(sources);
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  WebAudio: WebAudioDriver
};

run(main, drivers);
