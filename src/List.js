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
  let mutableLastId = 0;

  function createNewItem(props) {
    const id = mutableLastId++;
    const sinks = itemFn(props, id);
    return {id, DOM: sinks.DOM.remember(), Remove: sinks.Remove, WebAudio: sinks.WebAudio.remember()};
  }

  const initialState = [createNewItem({frequency: 200, volume: 1})]

  const addItemReducer$ = action$
    .filter(a => a.type === 'ADD_TRACK')
    .map(action => {
      const amount = action.payload;
      let newItems = [];
      for (let i = 0; i < amount; i++) {
        newItems.push({frequency: 200, volume: 1});
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

function audio(tracks$) {
    const webAudio$ = tracks$.map(tracks => tracks.map(track => track.WebAudio));

    let webAudios$ = [];

    webAudio$.addListener({
        next: webAudio => webAudios$.push(...webAudio)
    });

    return webAudios$[0];
}

function makeItemWrapper(DOM) {
  return function itemWrapper(props, id) {
    const track = isolate(Track)({DOM, Props: xs.of(props)});
    return {
      DOM: track.DOM,
      WebAudio: track.WebAudio,
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
  const audio$ = audio(tracks$);

  return {
    DOM: vtree$,
    WebAudio: audio$
  };
}

export default List;
