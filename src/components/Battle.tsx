export default function Battle() {
  return (
    <div id="battle" hidden>
      <div class="bwrap">
        <div class="arena">
          <div class="fighter"><div class="sprite" id="foeIcon" /><div class="win stat"><div id="foeName" /><div class="bar"><i id="foeHP" /></div><div id="round" /></div></div>
          <div class="fighter"><div class="sprite" id="meIcon" /><div class="win stat"><div id="meName" /><div class="bar me"><i id="meHP" /></div><div id="meHPtxt" /></div></div>
        </div>
        <div class="win lesson"><div class="keys" id="bKeys" /><p id="bLearn" /></div>
        <div class="panes" id="bPanes">
          <div class="pane"><h4 id="bYour" /><div class="buf" id="bBuf" /></div>
          <div class="pane" id="bGoalPane"><h4 id="bGoalH" /><div class="buf" id="bGoal" /></div>
        </div>
        <div class="status"><span class="mode" id="bMode" /><span class="pending" id="bPending" /><span id="bCount" /><span id="bNote" /></div>
        <div class="actions">
          <span class="help" id="bHelp" />
          <span id="bHint" />
        </div>
      </div>
    </div>
  );
}
