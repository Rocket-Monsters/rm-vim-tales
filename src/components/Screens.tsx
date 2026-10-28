// full-screen overlays: title menu, key wizard, Key Dojo mini-game
export default function Screens() {
  return (
    <>
      <div id="menu" class="screen">
        <div class="title">
          <div class="vs" id="mVs" />
          <h1>VIM-TALES</h1>
          <p class="tag" id="mTag1" />
          <p class="tag" id="mTag2" />
        </div>
        <div class="win menu-box" id="mBody" />
        <p class="help" id="mHelp" />
      </div>
      <div id="wizard" class="screen" hidden>
        <div class="win wiz">
          <div id="wStep" />
          <div id="wKey" class="bigkey" />
          <div id="wHands" />
          <p id="wFinger" class="finger" />
          <p id="wText" />
          <p id="wHint" />
        </div>
        <p class="help" id="wHelp" />
      </div>
      <div id="index" class="screen" hidden>
        <div class="win idx">
          <div class="idx-list" id="iList" />
          <div class="idx-page" id="iPage" />
        </div>
        <p class="help" id="iHelp" />
      </div>
      <div id="dojo" class="screen" hidden>
        <div class="win wiz">
          <div id="dStat" />
          <div class="bar"><i id="dTime" /></div>
          <div class="mouse" id="dMouse" />
          <div id="dKey" class="bigkey" />
          <div id="dHands" />
          <p id="dFinger" class="finger" />
          <p id="dText" />
        </div>
        <p class="help" id="dHelp" />
      </div>
    </>
  );
}
