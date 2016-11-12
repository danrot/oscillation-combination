import xs from 'xstream';
import {button, div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import Track from './Track';

function intent(DOM, trackRemove$) {
  return xs.merge(
    DOM.select('.add-one-btn').events('click')
      .mapTo({type: 'ADD_TRACK', payload: 1}),

    trackRemove$.map(id => ({type: 'REMOVE_TRACK', payload: id}))
  );
}

function model(action$, itemFn) {
  function createRandomItemProps() {
    let hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    const randomWidth = Math.floor(Math.random() * 800 + 200);
    return {color: hexColor, width: randomWidth};
  }

  let mutableLastId = 0;

  function createNewItem(props) {
    const id = mutableLastId++;
    const sinks = itemFn(props, id);
    return {id, DOM: sinks.DOM.remember(), Remove: sinks.Remove};
  }

  const addItemReducer$ = action$
    .filter(a => a.type === 'ADD_TRACK')
    .map(action => {
      const amount = action.payload;
      let newItems = [];
      for (let i = 0; i < amount; i++) {
        newItems.push(createNewItem(createRandomItemProps()));
      }
      return function addItemReducer(listItems) {
        return listItems.concat(newItems);
      };
    });

  const removeItemReducer$ = action$
    .filter(a => a.type === 'REMOVE_TRACK')
    .map(action => function removeItemReducer(listItems) {
      return listItems.filter(item => item.id !== action.payload);
    });

  const initialState = [createNewItem({color: 'red', width: 300})]

  return xs.merge(addItemReducer$, removeItemReducer$)
    .fold((listItems, reducer) => reducer(listItems), initialState);
}

function view(tracks$) {
  const addButtons = div('.addButtons', [
    button('.add-one-btn', 'Add Track')
  ]);

  return tracks$.map(tracks => {
    const trackVNodeStreamsByKey = tracks.map(track =>
      track.DOM.map(vnode => {
        vnode.key = track.id; return vnode;
      })
    );
    return xs.combine(...trackVNodeStreamsByKey)
      .map(vnodes => div('.list', [addButtons].concat(vnodes)));
  }).flatten();
}

function makeItemWrapper(DOM) {
  return function itemWrapper(props, id) {
    const track = isolate(Track)({DOM, Props: xs.of(props)});
    return {
      DOM: track.DOM,
      Remove: track.Remove.mapTo(id)
    }
  }
}

function List(sources) {
  const proxyTrackRemove$ = xs.create();
  const action$ = intent(sources.DOM, proxyTrackRemove$);
  const itemWrapper = makeItemWrapper(sources.DOM);
  const tracks$ = model(action$, itemWrapper);
  const trackRemove$ = tracks$
    .map(tracks => xs.merge(...tracks.map(item => item.Remove)))
    .flatten();
  proxyTrackRemove$.imitate(trackRemove$);
  const vtree$ = view(tracks$);

  return {
    DOM: vtree$
  };
}

export default List;
