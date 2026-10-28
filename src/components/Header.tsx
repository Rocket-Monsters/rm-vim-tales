export default function Header() {
  return (
    <header>
      <h1>VIM-TALES</h1>
      <span id="chap" />
      <div class="hud"><span id="hearts" /><span id="gold" /><span id="chestsHud" /><span id="keysHud" /><span id="lv" /><span id="stars" /></div>
      <button id="helpBtn" class="help-btn" aria-label="Help" aria-controls="drawer">?</button>
    </header>
  );
}
