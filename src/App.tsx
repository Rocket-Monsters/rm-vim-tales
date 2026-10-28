import { onMount, onCleanup } from 'solid-js';
import Header from './components/Header.tsx';
import Overworld from './components/Overworld.tsx';
import Dialog from './components/Dialog.tsx';
import Battle from './components/Battle.tsx';
import Screens from './components/Screens.tsx';
import { startGame } from './ui/controller.js';

export default function App() {
  onMount(() => onCleanup(startGame()));
  return (
    <>
      <Header />
      <div id="layout"><Overworld /></div>
      <Dialog />
      <div id="flash" />
      <div id="cmd" />
      <Battle />
      <Screens />
    </>
  );
}
