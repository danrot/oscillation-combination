import {button, div, input} from '@cycle/dom';
import xs from 'xstream';

function intent(DOM) {
  return xs.merge(
    DOM.select('.remove-btn').events('click')
      .mapTo({type: 'REMOVE'})
  );
}

function model(props$, action$) {
   return xs.of({ freq: 200 })
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

function Item(sources) {
  const action$ = intent(sources.DOM);
  const state$ = model(sources.Props, action$);
  const vtree$ = view(state$);

  return {
    DOM: vtree$,
    Remove: action$.filter(action => action.type === 'REMOVE'),
  };
}

export default Item;
