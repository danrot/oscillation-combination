import xs from 'xstream';
import { run }  from '@cycle/xstream-run';
import { makeDOMDriver, div } from '@cycle/dom';

function main() {
    return { DOM: xs.of(true).map(() => div()) };
}

run(main, { DOM: makeDOMDriver('#app')});
