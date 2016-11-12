import {button, div, input} from '@cycle/dom';
import isolate from '@cycle/isolate';
import xs from 'xstream';
import Sequence from './Sequence';

const DEFAULT_SEQ_FREQUENCY$ = 440

function intent(DOM, seqRemove$) {
  return xs.merge(
    DOM.select('.add-one-btn').events('click')
      .mapTo({type: 'ADD_SEQ', payload: 1}),

    seqRemove$.map(id => ({type: 'REMOVE_SEQ', payload: id}))
  );
}

function model(action$, itemFn) {
  let mutableLastId = 0;

  function createNewTrack(props) {
    const id = mutableLastId++;
    const sinks = itemFn(props, id);
    return {id, DOM: sinks.DOM.remember(), Remove: sinks.Remove, WebAudio: sinks.WebAudio};
  }

  const initialState = [createNewTrack({frequency: DEFAULT_SEQ_FREQUENCY$, volume: 1})]

  const addSeqReducer$ = action$
    .filter(a => a.type === 'ADD_SEQ')
    .map(action => {
      let newItems = [];
      newItems.push(initialState);
      return function addSeqReducer(listItems) {
        return listItems.concat(newItems);
      };
    });

  const removeSeqReducer$ = action$
    .filter(a => a.type === 'REMOVE_SEQ')
    .map(action => function removeSeqReducer(listItems) {
      return listItems.filter(item => item.id !== action.payload);
    });


  return xs.merge(addSeqReducer$, removeSeqReducer$)
    .fold((listItems, reducer) => reducer(listItems), initialState);
}

function view(sequences$) {
  const addSeqButton = div('.addButtons', [
    button('.add-one-btn', 'Add Sequence')
  ]);

  return sequences$.map(sequences => {
    const seqVNodeStreamsByKey = sequences.map(sequence =>
      sequence.DOM.map(vnode => {
        vnode.key = sequence.id;
        return vnode;
      }));

    const style = {
      border: '1px solid red',
      height: '70px',
      margin: '10px 0px'
    };

    return xs.combine(...seqVNodeStreamsByKey)
      .map(vnodes => div('.list', {style}, [addSeqButton].concat(vnodes)));
  }).flatten();
}

function audio(sequences$) {
    const webAudio$ = sequences$.map(sequences => sequences.map(sequence => sequence.WebAudio));
    let webAudios$ = [];

    webAudio$.addListener({
        next: webAudio => webAudios$.push(...webAudio)
    });

    return xs.combine(...webAudios$);
}

function makeItemWrapper(DOM) {
  return function itemWrapper(props, id) {
    const track = isolate(Sequence)({DOM, Props: xs.of(props)});
    return {
      DOM: track.DOM,
      Remove: track.Remove.mapTo(id),
      WebAudio: track.WebAudio
    }
  }
}

function Track(sources) {
  const proxySeqRemove$ = xs.create();
  const action$ = intent(sources.DOM, proxySeqRemove$);
  const itemWrapper = makeItemWrapper(sources.DOM);
  const sequences$ = model(action$, itemWrapper);
  const sequenceRemove$ = sequences$
    .map(sequences => xs.merge(...sequences.map(item => item.Remove)))
    .flatten();
  proxySeqRemove$.imitate(sequenceRemove$);
  const vtree$ = view(sequences$);
  const audio$ = audio(sequences$);

  return {
    DOM: vtree$,
    Remove: action$.filter(action => action.type === 'REMOVE'),
    WebAudio: audio$
  };
}

export default Track;
