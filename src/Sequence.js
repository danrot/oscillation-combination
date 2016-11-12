import {button, div, input} from '@cycle/dom';
import xs from 'xstream';

function intent(DOM) {
  return xs.merge(
    DOM.select('.remove-btn').events('click')
      .mapTo({type: 'REMOVE'}),
    DOM.select('input').events('change')
      .map(e => ({type: 'CHANGE_FREQUENCY', payload: e.target.value}))
  );
}

function model(props$, action$) {
    return action$.filter(a => a.type === 'CHANGE_FREQUENCY')
        .map(action => ({frequency: action.payload, volume: 1}))
        .startWith({frequency: 200, volume: 1});
}

function view(state$) {
  return state$.map(({freq}) => {
    const style = {
      border: '1px solid #000',
      height: '40px',
      width: '200px',
      display: 'inline-block'
    };
    return div('.item', {style}, [
      input('.freq', {
        attrs: {type: 'text', value: freq}
      }),
      button('.remove-btn', 'Remove')
    ]);
  });
}

function audio(state$) {
    return state$.map(({frequency}) => ({frequency, volume: 1}));
}

function Item(sources) {
  const action$ = intent(sources.DOM);
  const state$ = model(sources.Props, action$);
  const vtree$ = view(state$);
  const audio$ = audio(state$);
    audio$.addListener({next: v => console.log(v)});

  return {
    DOM: vtree$,
    Remove: action$.filter(action => action.type === 'REMOVE'),
    WebAudio: audio$
  };
}

export default Item;
