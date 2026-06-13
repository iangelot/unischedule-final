import { useState, useMemo, useRef, useEffect } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --g950:#071a0e;--g900:#0f2a1a;--g800:#1a4228;--g700:#235c38;--g600:#2d7a4a;
  --g500:#3a9e62;--g400:#5aba7d;--g300:#8ed4a4;--g200:#c4ecd2;--g100:#dff3e7;--g50:#f2fbf6;
  --a600:#b8720f;--a500:#d98c1a;--a400:#f0a824;--a200:#fde4a8;--a100:#fef3dc;--a50:#fffbf2;
  --r600:#b83228;--r500:#d63b30;--r200:#fac8c4;--r100:#fde8e6;--r50:#fff5f4;
  --b600:#1a5a8a;--b500:#2472a8;--b400:#2d7fc4;--b100:#d4eaf8;--b50:#f0f7fd;
  --p600:#5c2d8a;--p100:#e8d8f8;
  --n900:#1a2130;--n800:#2d3a4a;--n700:#445060;--n600:#5c6878;--n500:#7a8898;
  --n400:#9daab8;--n300:#bdc8d4;--n200:#dce3ea;--n100:#edf1f5;--n50:#f6f8fa;
  --white:#fff;
  --fd:'DM Serif Display',serif;--fb:'DM Sans',sans-serif;
  --r4:4px;--r8:8px;--r12:12px;--r16:16px;--r20:20px;
  --sw:230px;
}
body{font-family:var(--fb);background:var(--n50);color:var(--n900);line-height:1.5;font-size:14px}
button,input,select,textarea{font-family:var(--fb)}
button{cursor:pointer;border:none;background:none}

.app{display:flex;height:100vh;overflow:hidden}

/* SIDEBAR */
.sidebar{width:var(--sw);background:var(--g900);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sb-logo{padding:18px 18px 14px;border-bottom:1px solid var(--g800)}
.sb-logo h1{font-family:var(--fd);color:var(--white);font-size:20px;font-weight:400}
.sb-logo span{font-size:10px;color:var(--g400);font-weight:600;letter-spacing:.07em;text-transform:uppercase}
.sb-nav{padding:10px 0;flex:1}
.sb-sec{font-size:9px;font-weight:700;color:var(--g600);text-transform:uppercase;letter-spacing:.09em;padding:10px 16px 4px}
.nav-item{display:flex;align-items:center;gap:9px;padding:9px 16px;font-size:13px;font-weight:500;color:var(--g300);cursor:pointer;transition:all .12s;border-left:2px solid transparent}
.nav-item:hover{background:var(--g800);color:var(--white)}
.nav-item.active{background:rgba(255,255,255,.07);color:var(--white);border-left-color:var(--a400)}
.nav-item svg{width:15px;height:15px;opacity:.75;flex-shrink:0}
.nb{margin-left:auto;background:var(--r500);color:var(--white);font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px}
.sb-foot{padding:14px 16px;border-top:1px solid var(--g800);margin-top:auto}
.sb-info{font-size:10px;color:var(--g500);margin-bottom:8px;line-height:1.6}
.lang-row{display:flex;gap:4px}
.lbtn{font-size:10px;font-weight:700;padding:3px 10px;border-radius:var(--r4);color:var(--g400);transition:all .12s}
.lbtn.on{background:var(--a400);color:var(--white)}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:56px;background:var(--white);border-bottom:1px solid var(--n200);display:flex;align-items:center;padding:0 26px;gap:12px;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.tb-title{font-family:var(--fd);font-size:20px;color:var(--g900);font-weight:400}
.tb-right{display:flex;gap:8px;align-items:center;margin-left:auto}
.content{flex:1;overflow-y:auto;padding:24px 26px}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 15px;border-radius:var(--r8);font-size:12px;font-weight:600;transition:all .12s;cursor:pointer;white-space:nowrap}
.btn svg{width:13px;height:13px}
.btn-primary{background:var(--g700);color:var(--white)}
.btn-primary:hover{background:var(--g600)}
.btn-primary:disabled{background:var(--n300);cursor:not-allowed;opacity:.7}
.btn-outline{background:var(--white);color:var(--n700);border:1px solid var(--n200)}
.btn-outline:hover{background:var(--n50);border-color:var(--n300)}
.btn-ghost{background:transparent;color:var(--n600);padding:6px 8px}
.btn-ghost:hover{background:var(--n100)}
.btn-danger{background:var(--r500);color:var(--white)}
.btn-danger:hover{background:var(--r600)}
.btn-amber{background:var(--a400);color:var(--white)}
.btn-amber:hover{background:var(--a600)}
.btn-sm{padding:4px 10px;font-size:11px}

/* BADGES */
.badge{display:inline-flex;align-items:center;gap:3px;font-size:9px;font-weight:800;padding:2px 7px;border-radius:12px;text-transform:uppercase;letter-spacing:.05em}
.b-g{background:var(--g100);color:var(--g700)}
.b-r{background:var(--r100);color:var(--r600)}
.b-a{background:var(--a100);color:var(--a600)}
.b-b{background:var(--b100);color:var(--b600)}
.b-n{background:var(--n100);color:var(--n600)}
.b-p{background:var(--p100);color:var(--p600)}

/* CARDS */
.card{background:var(--white);border:1px solid var(--n200);border-radius:var(--r16);box-shadow:0 1px 4px rgba(0,0,0,.06)}
.card-hdr{padding:16px 20px 12px;border-bottom:1px solid var(--n100);display:flex;align-items:center;justify-content:space-between}
.card-title{font-size:13px;font-weight:700;color:var(--n900)}
.card-body{padding:20px}

/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.stat-card{background:var(--white);border:1px solid var(--n200);border-radius:var(--r16);padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,.06);cursor:pointer;transition:box-shadow .15s}
.stat-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.1)}
.stat-label{font-size:10px;font-weight:700;color:var(--n500);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
.stat-val{font-family:var(--fd);font-size:30px;color:var(--g900);line-height:1}
.stat-sub{font-size:11px;color:var(--n500);margin-top:4px}
.sa-g{border-top:3px solid var(--g500)}
.sa-a{border-top:3px solid var(--a400)}
.sa-b{border-top:3px solid var(--b400)}
.sa-r{border-top:3px solid var(--r500)}

/* SECTION HEADER */
.sh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px}
.sh-title{font-family:var(--fd);font-size:22px;color:var(--g900);font-weight:400}
.sh-sub{font-size:12px;color:var(--n500);margin-top:2px}

/* GRID LAYOUTS */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}

/* DATA TABLE */
.dt{width:100%;border-collapse:collapse}
.dt th{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--n500);padding:10px 16px;border-bottom:2px solid var(--n200);text-align:left;background:var(--n50)}
.dt td{padding:11px 16px;border-bottom:1px solid var(--n100);font-size:13px;color:var(--n800)}
.dt tr:hover td{background:var(--g50)}
.dt tr:last-child td{border-bottom:none}

/* TABS */
.tabs{display:flex;border-bottom:2px solid var(--n200);margin-bottom:18px}
.tab{padding:9px 18px;font-size:12px;font-weight:600;color:var(--n500);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .12s}
.tab.on{color:var(--g700);border-bottom-color:var(--g600)}
.tab:hover:not(.on){color:var(--n700)}

/* ALERT */
.alert{border-radius:var(--r8);padding:11px 14px;font-size:12px;margin-bottom:14px;display:flex;gap:9px;align-items:flex-start}
.alert svg{width:15px;height:15px;flex-shrink:0;margin-top:1px}
.alert-r{background:var(--r50);border:1px solid var(--r200);color:var(--r600)}
.alert-g{background:var(--g50);border:1px solid var(--g200);color:var(--g700)}
.alert-a{background:var(--a50);border:1px solid var(--a200);color:var(--a600)}

/* LOAD BAR */
.load-row{padding:8px 20px}
.load-top{display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px}
.load-bar{height:5px;background:var(--n100);border-radius:3px;overflow:hidden}
.load-fill{height:100%;border-radius:3px;transition:width .4s}

/* TIMETABLE */
.tt-wrap{background:var(--white);border:1px solid var(--n200);border-radius:var(--r16);overflow:hidden}
.tt-controls{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.mode-sw{display:flex;background:var(--n100);border-radius:var(--r8);padding:3px}
.msw-btn{padding:5px 14px;border-radius:6px;font-size:11px;font-weight:700;color:var(--n600);transition:all .12s}
.msw-btn.on{background:var(--white);color:var(--g800);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.legend{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.leg{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:var(--n500)}
.leg-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
.tt-scroll{overflow-x:auto}
.tt-table{width:100%;border-collapse:collapse;min-width:660px}
.tt-table th{background:var(--g900);color:var(--white);font-size:11px;font-weight:700;padding:10px 12px;text-align:left;letter-spacing:.04em;border-right:1px solid var(--g800)}
.tt-table th:first-child{background:var(--g950);width:84px}
.tt-table td{padding:5px;border:1px solid var(--n100);vertical-align:top;min-height:76px}
.tt-table td:first-child{font-size:9px;font-weight:700;color:var(--n500);padding:8px 8px 8px 6px;background:var(--n50);text-align:right;white-space:nowrap;border-right:1px solid var(--n200);line-height:1.6}
.tt-cell-inner{min-height:66px;position:relative}
.cell-drop{outline:2px dashed var(--g400);background:var(--g50)!important}
.cell-drop-conflict{outline:2px dashed var(--r500);background:var(--r50)!important}
.cell-drop-ok{outline:2px dashed var(--a400);background:var(--a50)!important}
.eve-bg{background:rgba(45,127,196,.04)}

/* SESSION CARD */
.sc{border-radius:var(--r8);padding:6px 8px;margin:2px 0;cursor:grab;transition:all .15s;position:relative;user-select:none;border:1px solid transparent}
.sc:active{cursor:grabbing;transform:scale(.97)}
.sc.dragging{opacity:.35}
.sc.day-s{background:var(--g100);border-color:var(--g300)}
.sc.eve-s{background:var(--b50);border-color:var(--b400)}
.sc.comb-s{border-left:3px solid var(--a400)!important}
.sc.conf-s{background:var(--r100);border-color:var(--r500)!important;animation:pr 2s infinite}
.sc.lock-s{cursor:not-allowed;opacity:.8}
@keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(214,59,48,.25)}50%{box-shadow:0 0 0 4px rgba(214,59,48,.08)}}
.sc-code{font-size:8px;font-weight:800;color:var(--n500);letter-spacing:.05em;text-transform:uppercase}
.sc-name{font-size:11px;font-weight:700;color:var(--g800);line-height:1.3;margin:1px 0}
.sc.eve-s .sc-name{color:var(--b600)}
.sc-meta{font-size:9px;color:var(--n600)}
.sc-groups{display:flex;gap:2px;margin-top:3px;flex-wrap:wrap}
.gp{font-size:8px;font-weight:800;padding:1px 4px;border-radius:2px;background:var(--g800);color:var(--white)}
.gp.eve{background:var(--b600)}
.gp.comb{background:var(--a500)}
.comb-tag{position:absolute;top:3px;right:16px;background:var(--a400);color:var(--white);font-size:7px;font-weight:800;padding:1px 4px;border-radius:2px}
.lock-tag{position:absolute;top:4px;right:4px;font-size:9px}
.add-hint{width:100%;min-height:66px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .12s;cursor:pointer;color:var(--n400);font-size:11px;gap:4px;border-radius:var(--r8)}
td:hover .add-hint{opacity:1}
.add-hint:hover{background:var(--g50);color:var(--g600)}

/* AVAILABILITY GRID */
.av-grid{display:grid;grid-template-columns:68px repeat(6,1fr);gap:3px;font-size:10px}
.av-hdr{font-weight:700;text-align:center;padding:3px;color:var(--n500);font-size:9px}
.av-lbl{font-size:9px;font-weight:700;color:var(--n500);display:flex;align-items:center;justify-content:flex-end;padding-right:5px}
.av-cell{height:26px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;cursor:pointer;transition:all .12s}
.av-y{background:var(--g100);color:var(--g700)}
.av-y:hover{background:var(--g200)}
.av-eve{background:var(--b50);color:var(--b600)}
.av-eve:hover{background:var(--b100)}
.av-n{background:var(--n100);color:var(--n400)}
.av-n:hover{background:var(--n200)}

/* MODAL */
.backdrop{position:fixed;inset:0;background:rgba(10,25,20,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px)}
.modal{background:var(--white);border-radius:var(--r20);width:100%;max-width:500px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.mhdr{padding:18px 22px 13px;border-bottom:1px solid var(--n100);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--white);z-index:10}
.mtitle{font-family:var(--fd);font-size:18px;color:var(--g900)}
.mbody{padding:20px 22px}
.mfoot{padding:12px 22px;border-top:1px solid var(--n100);display:flex;gap:8px;justify-content:flex-end;background:var(--white)}

/* FORM */
.fg{margin-bottom:14px}
.fl{font-size:11px;font-weight:700;color:var(--n700);margin-bottom:4px;display:flex;align-items:center;gap:5px}
.req{color:var(--r500)}
.fi,.fs{width:100%;padding:8px 10px;border:1.5px solid var(--n200);border-radius:var(--r8);font-size:13px;color:var(--n900);outline:none;transition:border .12s;background:var(--white)}
.fi:focus,.fs:focus{border-color:var(--g500)}
.group-picker{display:flex;flex-direction:column;gap:3px;max-height:150px;overflow-y:auto;border:1.5px solid var(--n200);border-radius:var(--r8);padding:5px}
.gp-item{display:flex;align-items:center;gap:8px;padding:5px 7px;border-radius:var(--r4);cursor:pointer;transition:background .1s}
.gp-item:hover{background:var(--n50)}
.gp-item.sel{background:var(--g50)}
.gp-chk{width:15px;height:15px;border-radius:3px;border:1.5px solid var(--n300);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .1s}
.gp-chk.on{background:var(--g600);border-color:var(--g600)}
.gp-chk svg{width:9px;height:9px;color:var(--white)}
.gp-name{font-size:12px;font-weight:500}
.gp-cnt{font-size:10px;color:var(--n500);margin-left:auto}
.cf-preview{border-radius:var(--r8);padding:9px 12px;margin-top:6px}
.cf-ok{background:var(--g50);border:1.5px solid var(--g200)}
.cf-err{background:var(--r50);border:1.5px solid var(--r200)}
.cf-title{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.cf-item{font-size:11px;padding:2px 0;display:flex;gap:5px}

/* DETAIL PANEL */
.dp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.dp-f{background:var(--n50);border-radius:var(--r8);padding:9px 11px}
.dp-k{font-size:9px;font-weight:800;color:var(--n500);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
.dp-v{font-size:13px;font-weight:600;color:var(--n900)}

/* CONFLICT LIST */
.cf-item-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--n100);align-items:flex-start}
.cf-item-row:last-child{border-bottom:none}
.cf-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cf-icon.hard{background:var(--r100)}
.cf-icon.soft{background:var(--a100)}
.cf-icon svg{width:15px;height:15px}
.cf-type{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.cf-type.hard{color:var(--r600)}
.cf-type.soft{color:var(--a600)}
.cf-desc{font-size:12px;color:var(--n800)}
.cf-meta{font-size:10px;color:var(--n500);margin-top:2px}

/* EMPTY STATE */
.empty{text-align:center;padding:50px 20px;color:var(--n400)}
.empty svg{width:40px;height:40px;margin:0 auto 12px;opacity:.4;display:block}

/* CHIP */
.chip{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700}
.chip-d{background:var(--g100);color:var(--g700)}
.chip-e{background:var(--b50);color:var(--b600)}
.chip-c{background:var(--a100);color:var(--a600)}

/* TOAST */
.toast{position:fixed;bottom:22px;right:22px;z-index:600;border-radius:var(--r12);padding:11px 16px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:9px;box-shadow:0 8px 24px rgba(0,0,0,.18);animation:sup .18s ease;max-width:320px;color:var(--white)}
.toast.ok{background:var(--g700)}
.toast.warn{background:var(--a500)}
.toast.err{background:var(--r600)}
@keyframes sup{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}

/* SESSION CARD — EXTRA STATES */
.sc.cancelled-s{background:var(--n100);border-color:var(--n300)!important;opacity:.7}
.sc.sub-s{background:var(--p100);border-color:var(--p600)!important}
.sc.makeup-s{background:var(--a50);border-color:var(--a400)!important;border-style:dashed!important}
.sub-tag{position:absolute;top:3px;right:16px;background:var(--p600);color:var(--white);font-size:7px;font-weight:800;padding:1px 4px;border-radius:2px}
.makeup-tag{position:absolute;top:3px;right:4px;background:var(--a500);color:var(--white);font-size:7px;font-weight:800;padding:1px 4px;border-radius:2px}
.cancel-tag{position:absolute;top:3px;right:4px;background:var(--n500);color:var(--white);font-size:7px;font-weight:800;padding:1px 4px;border-radius:2px}

/* SUBSTITUTION MODAL */
.sub-step{padding:6px 0}
.sub-step-title{font-size:10px;font-weight:800;color:var(--n500);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
.sub-lec-card{border:1.5px solid var(--n200);border-radius:var(--r12);padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:12px}
.sub-lec-card:hover{border-color:var(--g500);background:var(--g50)}
.sub-lec-card.selected{border-color:var(--g600);background:var(--g50)}
.sub-lec-avatar{width:36px;height:36px;border-radius:50%;background:var(--g800);color:var(--white);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.sub-lec-name{font-size:13px;font-weight:600;color:var(--n900)}
.sub-lec-meta{font-size:11px;color:var(--n500);margin-top:1px}
.sub-lec-status{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.no-sub{text-align:center;padding:24px 0;color:var(--n400);font-size:13px}

/* MAKEUP SLOTS */
.makeup-slot{border:1.5px solid var(--n200);border-radius:var(--r12);padding:11px 14px;margin-bottom:8px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:12px}
.makeup-slot:hover{border-color:var(--a400);background:var(--a50)}
.makeup-slot.selected{border-color:var(--a500);background:var(--a50)}
.makeup-slot.saturday{border-color:var(--g400);background:var(--g50)}
.makeup-slot.saturday:hover{background:var(--g100)}
.ms-day{font-size:13px;font-weight:700;color:var(--n900)}
.ms-time{font-size:12px;color:var(--n600);margin-top:1px}
.ms-sat-badge{font-size:9px;font-weight:800;background:var(--g800);color:var(--white);padding:1px 6px;border-radius:10px}

/* SMS PREVIEW */
.sms-preview{background:var(--n900);border-radius:var(--r12);padding:14px 16px;margin-top:12px}
.sms-header{font-size:9px;font-weight:700;color:var(--n400);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.sms-bubble{background:var(--g700);border-radius:12px 12px 12px 2px;padding:10px 12px;font-size:12px;color:var(--white);line-height:1.6;max-width:90%}
.sms-meta{font-size:10px;color:var(--n500);margin-top:6px}

/* GESTION PAGE */
.log-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--n100);align-items:flex-start}
.log-item:last-child{border-bottom:none}
.log-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px}
.log-main{font-size:13px;color:var(--n800);font-weight:500}
.log-meta{font-size:11px;color:var(--n500);margin-top:2px}
.log-time{font-size:10px;color:var(--n400);margin-left:auto;white-space:nowrap;padding-top:2px}
.stat-mini{background:var(--n50);border-radius:var(--r8);padding:10px 14px;text-align:center}
.stat-mini-val{font-family:var(--fd);font-size:24px;color:var(--g900)}
.stat-mini-lbl{font-size:10px;color:var(--n500);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}


/* GENERATING OVERLAY */
.gen-overlay{position:fixed;inset:0;background:rgba(5,18,10,.88);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
.gen-panel{background:var(--g950);border:1px solid var(--g800);border-radius:var(--r20);padding:32px 36px;width:100%;max-width:480px;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.gen-title{font-family:var(--fd);font-size:24px;color:var(--white);margin-bottom:4px}
.gen-sub{font-size:12px;color:var(--g400);margin-bottom:28px}
.gen-phase{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:3px 10px;border-radius:20px;margin-bottom:20px}
.gen-phase.greedy{background:rgba(90,186,125,.15);color:var(--g400)}
.gen-phase.annealing{background:rgba(240,168,36,.12);color:var(--a400)}
.gen-phase.done{background:rgba(90,186,125,.2);color:var(--g300)}
.spin-sm{width:10px;height:10px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.gen-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}
.gm-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:var(--r12);padding:12px 14px}
.gm-val{font-family:var(--fd);font-size:26px;color:var(--white);line-height:1}
.gm-lbl{font-size:9px;font-weight:700;color:var(--g500);text-transform:uppercase;letter-spacing:.07em;margin-top:3px}
.gen-progress{margin-bottom:20px}
.gp-label{display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;color:var(--g400)}
.gp-bar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
.gp-fill{height:100%;border-radius:3px;transition:width .3s ease;background:linear-gradient(90deg,var(--g600),var(--g400))}
.gp-fill.annealing-fill{background:linear-gradient(90deg,var(--a600),var(--a400))}
.gen-log{height:80px;overflow-y:auto;font-size:10px;color:var(--g500);font-family:monospace;line-height:1.8;padding:8px 10px;background:rgba(0,0,0,.3);border-radius:var(--r8);margin-bottom:20px}
.gen-log-line{opacity:.8}
.gen-log-line.new{color:var(--g300);opacity:1}
.gen-actions{display:flex;justify-content:flex-end;gap:8px}
.score-bar{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.score-label{font-size:11px;color:var(--g400);min-width:80px}
.score-track{flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}
.score-fill{height:100%;border-radius:4px;transition:width .4s ease}

/* STUDENT PORTAL */
.portal-hero{background:var(--g900);border-radius:var(--r16);padding:28px 28px 24px;margin-bottom:20px;position:relative;overflow:hidden}
.portal-hero::after{content:'';position:absolute;right:-30px;top:-30px;width:180px;height:180px;background:var(--g800);border-radius:50%;opacity:.5}
.portal-title{font-family:var(--fd);font-size:26px;color:var(--white);font-weight:400;position:relative;z-index:1}
.portal-sub{font-size:13px;color:var(--g400);margin-top:4px;position:relative;z-index:1}
.portal-select{margin-top:16px;position:relative;z-index:1}
.portal-select select{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:var(--white);border-radius:var(--r8);padding:8px 12px;font-size:13px;width:100%;max-width:320px;outline:none}
.portal-select select option{background:var(--g900);color:var(--white)}
.view-toggle{display:flex;gap:6px;margin-bottom:16px}
.view-btn{padding:5px 14px;border-radius:var(--r8);font-size:11px;font-weight:700;border:1px solid var(--n200);background:var(--white);color:var(--n600);cursor:pointer;transition:all .12s}
.view-btn.on{background:var(--g700);color:var(--white);border-color:var(--g700)}
.list-sess{background:var(--white);border:1px solid var(--n200);border-radius:var(--r12);padding:12px 16px;margin-bottom:8px;display:flex;gap:14px;align-items:flex-start}
.list-day-badge{min-width:52px;text-align:center;padding:6px 4px;background:var(--g900);border-radius:var(--r8)}
.ldb-day{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--g400)}
.ldb-slot{font-size:10px;font-weight:600;color:var(--white);margin-top:2px;line-height:1.3}
.list-sess-course{font-size:13px;font-weight:700;color:var(--g800)}
.list-sess-meta{font-size:11px;color:var(--n500);margin-top:3px}
.list-sess-tags{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}

/* PRINT */
.print-header{display:none}
@media print{
  .sidebar,.topbar,.tt-controls,.add-hint,.no-print{display:none!important}
  .app,.main,.content{display:block!important;height:auto!important;overflow:visible!important;padding:0!important}
  .print-header{display:block!important;margin-bottom:16px;padding:0 0 12px;border-bottom:2px solid #1a4228}
  .tt-wrap{box-shadow:none!important;border:1px solid #ddd!important}
  .tt-table th{background:#1a4228!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sc{break-inside:avoid;page-break-inside:avoid}
  body{background:white!important}
}

/* EXAM MODULE */
.exam-card{background:var(--white);border:1px solid var(--n200);border-radius:var(--r12);padding:14px 18px;margin-bottom:10px;display:flex;gap:14px;align-items:flex-start;transition:box-shadow .12s;cursor:pointer}
.exam-card:hover{box-shadow:0 2px 10px rgba(0,0,0,.08);border-color:var(--n300)}
.exam-card.has-conflict{border-left:3px solid var(--r500);background:var(--r50)}
.exam-date-badge{min-width:52px;text-align:center;background:var(--p600);border-radius:var(--r8);padding:7px 5px;flex-shrink:0}
.edb-day{font-size:18px;font-weight:800;color:var(--white);line-height:1}
.edb-month{font-size:9px;font-weight:700;color:var(--p100);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
.exam-info{flex:1;min-width:0}
.exam-course{font-size:13px;font-weight:700;color:var(--n900)}
.exam-meta{font-size:11px;color:var(--n500);margin-top:3px;display:flex;gap:12px;flex-wrap:wrap}
.exam-meta span{display:flex;align-items:center;gap:3px}
.exam-groups{display:flex;gap:3px;margin-top:6px;flex-wrap:wrap}
.exam-type-badge{font-size:9px;font-weight:800;padding:2px 7px;border-radius:10px;text-transform:uppercase}
.type-written{background:var(--p100);color:var(--p600)}
.type-oral{background:var(--b100);color:var(--b600)}
.type-practical{background:var(--a100);color:var(--a600)}
.exam-grid{display:grid;grid-template-columns:80px repeat(5,1fr);gap:2px;margin-bottom:20px}
.eg-header{background:var(--p600);color:var(--white);font-size:10px;font-weight:700;padding:7px 8px;text-align:center;letter-spacing:.04em}
.eg-header:first-child{background:var(--g950)}
.eg-slot{font-size:9px;font-weight:700;color:var(--n500);padding:5px 6px;background:var(--n50);text-align:right;border:1px solid var(--n100)}
.eg-cell{border:1px solid var(--n100);padding:3px;min-height:60px;background:var(--white)}
.eg-cell.has-exam{background:var(--p100)}
.ex-chip{background:var(--p100);border:1px solid var(--p600);border-radius:var(--r4);padding:4px 6px;margin:2px 0;font-size:10px;cursor:pointer}
.ex-chip:hover{background:var(--p600);color:var(--white)}
.ex-chip .ec-code{font-weight:800;color:var(--p600);font-size:9px}
.ex-chip:hover .ec-code{color:var(--white)}
.ex-chip .ec-name{color:var(--n700);margin-top:1px;line-height:1.3}
.ex-chip:hover .ec-name{color:var(--white)}
.ex-chip .ec-meta{font-size:9px;color:var(--n500)}
.ex-chip:hover .ec-meta{color:rgba(255,255,255,.8)}
.exam-stat{background:var(--p100);border-radius:var(--r8);padding:12px 16px;text-align:center}
.exam-stat-val{font-family:var(--fd);font-size:26px;color:var(--p600)}
.exam-stat-lbl{font-size:10px;font-weight:700;color:var(--p600);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
`;

// ── DATA ─────────────────────────────────────────────────────────────────────
const GROUPS = [
  {id:"g1",name:"SWE-L3-J",prog:"Génie Logiciel",level:3,mode:"day",count:35},
  {id:"g2",name:"RESEAU-L3-J",prog:"Réseaux & Télécoms",level:3,mode:"day",count:40},
  {id:"g3",name:"GRAPHISME-L3-J",prog:"Infographie",level:3,mode:"day",count:28},
  {id:"g4",name:"SWE-L3-S",prog:"Génie Logiciel",level:3,mode:"evening",count:22},
  {id:"g5",name:"RESEAU-L3-S",prog:"Réseaux & Télécoms",level:3,mode:"evening",count:19},
  {id:"g6",name:"SWE-L2-J",prog:"Génie Logiciel",level:2,mode:"day",count:45},
];
const LECTURERS = [
  {id:"l1",name:"Dr. Mbarga",full:"Dr. Emmanuel Mbarga",type:"permanent",day:true,eve:true,maxH:18,phone:"+237 677 001 234",
   avail:{0:[1,1,1,0,0,0],1:[1,1,1,0,0,0],2:[1,1,1,1,1,0],3:[1,1,1,0,0,0],4:[1,1,1,0,0,0],5:[0,0,0,0,0,0]}},
  {id:"l2",name:"Mme. Diallo",full:"Mme. Fatou Diallo",type:"permanent",day:true,eve:false,maxH:20,phone:"+237 699 456 789",
   avail:{0:[1,1,1,0,0,0],1:[1,1,1,0,0,0],2:[1,1,1,0,0,0],3:[1,1,1,0,0,0],4:[1,1,1,0,0,0],5:[0,0,0,0,0,0]}},
  {id:"l3",name:"M. Essomba",full:"M. Patrick Essomba",type:"vacataire",day:false,eve:true,maxH:10,phone:"+237 655 321 654",
   avail:{0:[0,0,0,1,1,0],1:[0,0,0,0,0,0],2:[0,0,0,1,1,0],3:[0,0,0,0,0,0],4:[0,0,0,1,1,0],5:[1,1,0,0,0,0]}},
  {id:"l4",name:"Dr. Bah",full:"Dr. Aissatou Bah",type:"visiting",day:true,eve:true,maxH:12,phone:"+237 677 888 333",
   avail:{0:[1,1,0,0,0,0],1:[1,1,0,1,1,0],2:[0,0,0,0,0,0],3:[1,1,0,1,1,0],4:[0,0,0,0,0,0],5:[0,0,0,0,0,0]}},
];
const ROOMS = [
  {id:"r1",name:"Amphi A",type:"amphitheater",cap:200,eve:true,faculty:"Shared",proj:true},
  {id:"r2",name:"Amphi B",type:"amphitheater",cap:120,eve:true,faculty:"Shared",proj:true},
  {id:"r3",name:"Salle 101",type:"classroom",cap:50,eve:true,faculty:"Informatique",proj:false},
  {id:"r4",name:"Salle 102",type:"classroom",cap:50,eve:false,faculty:"Informatique",proj:true},
  {id:"r5",name:"Labo Réseau",type:"lab",cap:30,eve:false,faculty:"Informatique",proj:false},
  {id:"r6",name:"Labo Info 1",type:"lab",cap:35,eve:true,faculty:"Informatique",proj:true},
];
const COURSES = [
  {id:"c1",code:"INF301",fr:"Gestion de Projet",en:"Project Management",shareable:true},
  {id:"c2",code:"INF302",fr:"Structures de Données",en:"Data Structures",shareable:false},
  {id:"c3",code:"RES301",fr:"Administration Réseaux",en:"Network Admin",shareable:false},
  {id:"c4",code:"INF303",fr:"Bases de Données",en:"Databases",shareable:false},
  {id:"c5",code:"GFX301",fr:"Design Graphique",en:"Graphic Design",shareable:false},
  {id:"c6",code:"MGT201",fr:"Management",en:"Management",shareable:true},
  {id:"c7",code:"INF304",fr:"Programmation Web",en:"Web Programming",shareable:false},
];
const INIT_SESSIONS = [
  {id:"s1",courseId:"c1",lecId:"l1",roomId:"r2",day:0,slot:1,groups:["g1","g2","g3"],combined:true,mode:"day",locked:false},
  {id:"s2",courseId:"c2",lecId:"l2",roomId:"r3",day:0,slot:0,groups:["g1"],combined:false,mode:"day",locked:false},
  {id:"s3",courseId:"c3",lecId:"l4",roomId:"r5",day:1,slot:2,groups:["g2"],combined:false,mode:"day",locked:true},
  {id:"s4",courseId:"c1",lecId:"l1",roomId:"r2",day:1,slot:0,groups:["g4","g5"],combined:true,mode:"evening",locked:false},
  {id:"s5",courseId:"c4",lecId:"l3",roomId:"r3",day:2,slot:1,groups:["g4"],combined:false,mode:"evening",locked:false},
  {id:"s6",courseId:"c2",lecId:"l2",roomId:"r3",day:2,slot:0,groups:["g6"],combined:false,mode:"day",locked:false},
  {id:"s7",courseId:"c5",lecId:"l4",roomId:"r6",day:3,slot:0,groups:["g3"],combined:false,mode:"day",locked:false},
  {id:"s8",courseId:"c7",lecId:"l1",roomId:"r3",day:3,slot:2,groups:["g1"],combined:false,mode:"day",locked:false},
  // intentional conflict: l2 double-booked day 2 slot 0
  {id:"s9",courseId:"c6",lecId:"l2",roomId:"r4",day:2,slot:0,groups:["g3"],combined:false,mode:"day",locked:false},
];

const DAY_SLOTS = ["07:00–09:00","09:00–11:00","11:00–13:00","14:00–16:00","16:00–18:00"];
const EVE_SLOTS = ["18:00–20:00","20:00–22:00"];
const DAYS_FR = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
const DAYS_EN = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const AV_SLOTS = ["07-09","09-11","11-13","14-16","16-18","18-21"];

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  fr:{
    dashboard:"Tableau de bord",timetable:"Emploi du temps",groups:"Groupes",
    lecturers:"Enseignants",rooms:"Salles",conflicts:"Conflits",
    day:"Journée",evening:"Soirée",combined:"Combinée",locked:"Verrouillée",
    addSession:"Ajouter séance",editSession:"Modifier séance",
    course:"Cours",lecturer:"Enseignant",room:"Salle",slot:"Créneau",dayLbl:"Jour",
    save:"Enregistrer",cancel:"Annuler",delete:"Supprimer",
    noConflict:"Aucun conflit détecté",conflictsFound:"Conflits détectés",
    clickToAdd:"Ajouter",dragInfo:"Glissez pour déplacer · Cliquez pour détail",
    students:"étudiants",lockToggle:"Verrouiller",unlockToggle:"Déverrouiller",
    semester:"Semestre 1 — 2025-2026",inst:"ISIMA Yaoundé",
    totalGroups:"Groupes actifs",totalLecs:"Enseignants",totalRooms:"Salles",
    hardConflicts:"Conflits critiques",sessions:"Séances",
    confirmDelete:"Supprimer cette séance ?",yes:"Oui, supprimer",
    permanent:"Permanent",vacataire:"Vacataire",visiting:"Invité",
    amphitheater:"Amphithéâtre",classroom:"Salle de cours",lab:"Laboratoire",
    shared:"Partagée",eveningOk:"Soirée OK",capacity:"Capacité",
    warnings:"avertissements",all:"Tous",hard:"CRITIQUE",soft:"AVERTISSEMENT",
    noConflicts:"Aucun conflit détecté dans l'emploi du temps.",
    affectedSessions:"Séances concernées",
    generate:"Générer l'EDT",generating:"Génération en cours...",
    genSub:"Application des contraintes africaines",
    savedOk:"Séance enregistrée",movedOk:"Séance déplacée",deletedOk:"Séance supprimée",
    lockedMsg:"Séance verrouillée",conflictBlocked:"Conflit — déplacement annulé",
    availability:"Disponibilités",selectLec:"Sélectionnez un enseignant",
    load:"Charge",groups2:"groupes",
    // NEW
    gestion:"Gestion",cancelSession:"Annuler la séance",
    substitute:"Remplaçant",substituteAssign:"Assigner un remplaçant",
    makeupClass:"Cours de rattrapage",scheduleMakeup:"Planifier le rattrapage",
    cancelReason:"Raison de l'annulation",
    reasonOptions:["Maladie","Voyage / conférence","Urgence personnelle","Autre"],
    eligibleSubs:"Remplaçants disponibles",noEligibleSubs:"Aucun remplaçant disponible à ce créneau",
    freeSlots:"Créneaux libres suggérés",noFreeSlots:"Aucun créneau libre trouvé",
    saturdaySlot:"Samedi (recommandé)",smsPreview:"Aperçu SMS",
    step1:"Étape 1 — Annuler",step2:"Étape 2 — Remplaçant",step3:"Étape 3 — Rattrapage",
    cancelledSessions:"Séances annulées",substituteAssigned:"Remplaçant assigné",
    makeupScheduled:"Rattrapage planifié",auditLog:"Journal des modifications",
    cancelOk:"Séance annulée",subOk:"Remplaçant assigné",makeupOk:"Rattrapage planifié",
    cancelledBadge:"ANNULÉ",subBadge:"SUB",makeupBadge:"RATTRAPAGE",
    noLogs:"Aucune modification enregistrée.",
    sendSmsTo:"Envoyer SMS à tous les groupes concernés",
    sessionInfo:"Informations séance",
    exportPdf:"Exporter PDF",printView:"Vue impression",
    studentPortal:"Portail étudiant",
    portalTitle:"Mon emploi du temps",
    portalSub:"Sélectionnez votre groupe pour voir votre emploi du temps",
    selectGroup:"Sélectionner un groupe",
    mySchedule:"Mon planning",
    printHint:"Utilisez Ctrl+P / Cmd+P pour imprimer ou enregistrer en PDF",
    generatedOn:"Généré le",noSessions:"Aucune séance planifiée pour ce groupe.",
    weeklyView:"Vue semaine",listView:"Vue liste",
    // EXAM MODULE
    exams:"Examens",examModule:"Module Examens",examSub:"Planification des examens de fin de semestre",
    addExam:"Ajouter examen",editExam:"Modifier examen",
    examDate:"Date",examStart:"Heure début",examDuration:"Durée (min)",
    examInvigilator:"Surveillant",examRoom:"Salle d'examen",
    examGroups:"Groupes concernés",examConflicts:"Conflits examens",
    noExamConflicts:"Aucun conflit d'examen détecté.",
    examSameDay:"Même jour — même groupe",examRoomBusy:"Salle occupée",
    examInvigBusy:"Surveillant occupé",examCapacity:"Capacité insuffisante",
    generateExams:"Générer les examens",generatingExams:"Génération...",
    examGenSub:"Placement des examens sans conflit",
    examOk:"Examen enregistré",examDeleted:"Examen supprimé",
    noExams:"Aucun examen planifié. Cliquez sur + pour ajouter.",
    examWeek:"Semaine d'examens",examWeekSub:"7 créneaux par jour · 8h–18h",
    invigilator:"Surveillant",duration:"Durée",examType:"Type",
    written:"Écrit",oral:"Oral",practical:"Pratique",
    exportExamPdf:"Exporter PDF examens",
    examConflictCount:"conflit(s) d'examen",
  },
  en:{
    dashboard:"Dashboard",timetable:"Timetable",groups:"Groups",
    lecturers:"Lecturers",rooms:"Rooms",conflicts:"Conflicts",
    day:"Day",evening:"Evening",combined:"Combined",locked:"Locked",
    addSession:"Add session",editSession:"Edit session",
    course:"Course",lecturer:"Lecturer",room:"Room",slot:"Slot",dayLbl:"Day",
    save:"Save",cancel:"Cancel",delete:"Delete",
    noConflict:"No conflicts detected",conflictsFound:"Conflicts found",
    clickToAdd:"Add",dragInfo:"Drag to reschedule · Click for detail",
    students:"students",lockToggle:"Lock",unlockToggle:"Unlock",
    semester:"Semester 1 — 2025-2026",inst:"ISIMA Yaoundé",
    totalGroups:"Active groups",totalLecs:"Lecturers",totalRooms:"Rooms",
    hardConflicts:"Critical conflicts",sessions:"Sessions",
    confirmDelete:"Delete this session?",yes:"Yes, delete",
    permanent:"Permanent",vacataire:"Vacataire",visiting:"Guest",
    amphitheater:"Amphitheater",classroom:"Classroom",lab:"Laboratory",
    shared:"Shared",eveningOk:"Evening OK",capacity:"Capacity",
    warnings:"warnings",all:"All",hard:"CRITICAL",soft:"WARNING",
    noConflicts:"No conflicts detected in the timetable.",
    affectedSessions:"Affected sessions",
    generate:"Generate Timetable",generating:"Generating...",
    genSub:"Applying African university constraints",
    savedOk:"Session saved",movedOk:"Session moved",deletedOk:"Session deleted",
    lockedMsg:"Session is locked",conflictBlocked:"Conflict — move cancelled",
    availability:"Availability",selectLec:"Select a lecturer",
    load:"Load",groups2:"groups",
    // NEW
    gestion:"Management",cancelSession:"Cancel session",
    substitute:"Substitute",substituteAssign:"Assign substitute",
    makeupClass:"Make-up class",scheduleMakeup:"Schedule make-up",
    cancelReason:"Reason for cancellation",
    reasonOptions:["Illness","Travel / conference","Personal emergency","Other"],
    eligibleSubs:"Available substitutes",noEligibleSubs:"No available substitutes for this slot",
    freeSlots:"Suggested free slots",noFreeSlots:"No free slots found",
    saturdaySlot:"Saturday (recommended)",smsPreview:"SMS preview",
    step1:"Step 1 — Cancel",step2:"Step 2 — Substitute",step3:"Step 3 — Make-up",
    cancelledSessions:"Cancelled sessions",substituteAssigned:"Substitute assigned",
    makeupScheduled:"Make-up scheduled",auditLog:"Change log",
    cancelOk:"Session cancelled",subOk:"Substitute assigned",makeupOk:"Make-up scheduled",
    cancelledBadge:"CANCELLED",subBadge:"SUB",makeupBadge:"MAKEUP",
    noLogs:"No changes recorded yet.",
    sendSmsTo:"Send SMS to all affected groups",
    sessionInfo:"Session info",
    exportPdf:"Export PDF",printView:"Print view",
    studentPortal:"Student portal",
    portalTitle:"My timetable",
    portalSub:"Select your group to view your timetable",
    selectGroup:"Select a group",
    mySchedule:"My schedule",
    printHint:"Use Ctrl+P / Cmd+P to print or save as PDF",
    generatedOn:"Generated on",noSessions:"No sessions scheduled for this group.",
    weeklyView:"Weekly view",listView:"List view",
    // EXAM MODULE
    exams:"Exams",examModule:"Exam Module",examSub:"End-of-semester exam scheduling",
    addExam:"Add exam",editExam:"Edit exam",
    examDate:"Date",examStart:"Start time",examDuration:"Duration (min)",
    examInvigilator:"Invigilator",examRoom:"Exam room",
    examGroups:"Groups",examConflicts:"Exam conflicts",
    noExamConflicts:"No exam conflicts detected.",
    examSameDay:"Same day — same group",examRoomBusy:"Room occupied",
    examInvigBusy:"Invigilator busy",examCapacity:"Insufficient capacity",
    generateExams:"Auto-schedule exams",generatingExams:"Scheduling...",
    examGenSub:"Placing exams without conflicts",
    examOk:"Exam saved",examDeleted:"Exam deleted",
    noExams:"No exams scheduled. Click + to add.",
    examWeek:"Exam week",examWeekSub:"7 slots per day · 8h–18h",
    invigilator:"Invigilator",duration:"Duration",examType:"Type",
    written:"Written",oral:"Oral",practical:"Practical",
    exportExamPdf:"Export exam PDF",
    examConflictCount:"exam conflict(s)",
  }
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const IC = {
  dashboard:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM2 14a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm10-2a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2a2 2 0 00-2-2h-4z"/></svg>,
  calendar:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>,
  users:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
  book:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>,
  room:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>,
  alert:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
  check:<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>,
  plus:<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"/></svg>,
  x:<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>,
  lock:<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 4a4 4 0 018 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25v-5.5C2 6.784 2.784 6 3.75 6H4V4zm6.5 2V4a2.5 2.5 0 00-5 0v2h5zM8 10a1 1 0 110 2 1 1 0 010-2z"/></svg>,
  edit:<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064l6.286-6.286z"/></svg>,
  trash:<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.559L5 13.25h6l.504-6.691a.75.75 0 011.492.142l-.535 7.109A1.75 1.75 0 0110.714 15H5.286a1.75 1.75 0 01-1.747-1.19l-.535-7.109a.75.75 0 111.492-.142zM6.5 1.75V3h3V1.75a.25.25 0 00-.25-.25h-2.5a.25.25 0 00-.25.25z"/></svg>,
  bolt:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>,
  group:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>,
  swap:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/></svg>,
  cancel:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>,
  makeup:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm5 5a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/></svg>,
  sms:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>,
  log:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  print:<svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9h8v3H6v-3zm-2-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg>,
  portal:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>,
  exam:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
};

// ── CONFLICT ENGINE ────────────────────────────────────────────────────────────
function detectConflicts(sessions) {
  const active = sessions.filter(s => s.status !== "cancelled");
  const issues = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (a.day !== b.day || a.slot !== b.slot) continue;
      if (a.lecId === b.lecId) {
        const l = LECTURERS.find(x => x.id === a.lecId);
        issues.push({id:`lec${i}${j}`,type:"LECTURER_DOUBLE_BOOKED",severity:"hard",sessIds:[a.id,b.id],
          msg_fr:`${l?.name} assigné(e) à deux séances simultanées`,
          msg_en:`${l?.name} assigned to two simultaneous sessions`});
      }
      if (a.roomId === b.roomId) {
        const r = ROOMS.find(x => x.id === a.roomId);
        issues.push({id:`room${i}${j}`,type:"ROOM_DOUBLE_BOOKED",severity:"hard",sessIds:[a.id,b.id],
          msg_fr:`${r?.name} réservée deux fois au même créneau`,
          msg_en:`${r?.name} is double-booked at the same timeslot`});
      }
      const shared = a.groups.filter(g => b.groups.includes(g));
      if (shared.length) {
        const gnames = shared.map(gid => GROUPS.find(g => g.id === gid)?.name).join(", ");
        issues.push({id:`grp${i}${j}`,type:"GROUP_CLASH",severity:"hard",sessIds:[a.id,b.id],
          msg_fr:`Groupe ${gnames} a deux cours simultanés`,
          msg_en:`Group ${gnames} has two simultaneous classes`});
      }
    }
    const s = active[i];
    const room = ROOMS.find(r => r.id === s.roomId);
    const total = s.groups.reduce((sum,gid) => sum + (GROUPS.find(g => g.id === gid)?.count || 0), 0);
    if (room && total > room.cap)
      issues.push({id:`cap${i}`,type:"CAPACITY_EXCEEDED",severity:"hard",sessIds:[s.id],
        msg_fr:`${room.name} (cap.${room.cap}) insuffisant pour ${total} étudiants`,
        msg_en:`${room.name} (cap.${room.cap}) cannot fit ${total} students`});
    if (s.mode === "evening" && room && !room.eve)
      issues.push({id:`eve${i}`,type:"ROOM_NO_EVENING",severity:"hard",sessIds:[s.id],
        msg_fr:`${room?.name} non disponible en soirée`,
        msg_en:`${room?.name} not available for evening sessions`});
    const lec = LECTURERS.find(l => l.id === s.lecId);
    if (s.mode === "evening" && lec && !lec.eve)
      issues.push({id:`leceve${i}`,type:"LECTURER_NO_EVENING",severity:"hard",sessIds:[s.id],
        msg_fr:`${lec?.name} n'enseigne pas en soirée`,
        msg_en:`${lec?.name} does not teach evenings`});
    const hasDaySession = active.some(x => x.id !== s.id && x.lecId === s.lecId && x.day === s.day && x.mode === "day");
    const hasEveSession = active.some(x => x.id !== s.id && x.lecId === s.lecId && x.day === s.day && x.mode === "evening");
    if (s.mode === "evening" && hasDaySession && !issues.find(c => c.type === "LECTURER_FATIGUE" && c.sessIds.includes(s.id)))
      issues.push({id:`fat${i}`,type:"LECTURER_FATIGUE",severity:"soft",sessIds:[s.id],
        msg_fr:`${lec?.name} enseigne en journée ET en soirée le même jour`,
        msg_en:`${lec?.name} teaches both day and evening on the same day`});
    if (s.mode === "day" && hasEveSession && !issues.find(c => c.type === "LECTURER_FATIGUE" && c.sessIds.includes(s.id)))
      issues.push({id:`fat${i}b`,type:"LECTURER_FATIGUE",severity:"soft",sessIds:[s.id],
        msg_fr:`${lec?.name} enseigne en journée ET en soirée le même jour`,
        msg_en:`${lec?.name} teaches both day and evening on the same day`});
  }
  return issues.filter((c,i,a) => a.findIndex(x=>x.id===c.id)===i);
}

function checkProposal(sessions, excludeId, proposal) {
  // Only include active sessions (not cancelled) when checking proposals
  const base = sessions.filter(s => s.id !== excludeId && s.status !== "cancelled");
  const all = [...base, {...proposal, id: excludeId||"__new__"}];
  return detectConflicts(all).filter(c => c.sessIds.includes(excludeId||"__new__"));
}

// ── SESSION FORM ──────────────────────────────────────────────────────────────
function SessionForm({lang, sessions, initial, onSave, onClose, onDelete}) {
  const t = T[lang];
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    courseId: initial?.courseId||"",
    lecId: initial?.lecId||"",
    roomId: initial?.roomId||"",
    day: initial?.day??0,
    slot: initial?.slot??0,
    groups: initial?.groups||[],
    mode: initial?.mode||"day",
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleGroup = gid => setForm(p=>({...p,groups:p.groups.includes(gid)?p.groups.filter(x=>x!==gid):[...p.groups,gid]}));

  const slots = form.mode==="day" ? DAY_SLOTS : EVE_SLOTS;
  const validGroups = GROUPS.filter(g=>g.mode===form.mode);
  const validLecs = LECTURERS.filter(l=>form.mode==="day"?l.day:l.eve);
  const validRooms = ROOMS.filter(r=>form.mode==="day"||r.eve);
  const selRoom = ROOMS.find(r=>r.id===form.roomId);
  const totalStudents = form.groups.reduce((s,gid)=>s+(GROUPS.find(g=>g.id===gid)?.count||0),0);

  const proposal = form.courseId&&form.lecId&&form.roomId&&form.groups.length ? {
    courseId:form.courseId,lecId:form.lecId,roomId:form.roomId,
    day:Number(form.day),slot:Number(form.slot),groups:form.groups,
    mode:form.mode,combined:form.groups.length>1,
  } : null;

  const cfls = useMemo(()=>proposal?checkProposal(sessions,initial?.id,proposal):[],[form,sessions]);
  const hardCfls = cfls.filter(c=>c.severity==="hard");
  const canSave = proposal && hardCfls.length===0;

  if (confirmDel) return (
    <div style={{textAlign:"center",padding:"10px 0"}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{t.confirmDelete}</div>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        <button className="btn btn-danger" onClick={()=>{onDelete(initial.id);onClose();}}>{t.yes}</button>
        <button className="btn btn-outline" onClick={()=>setConfirmDel(false)}>{t.cancel}</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fg">
        <label className="fl">Mode</label>
        <div className="mode-sw" style={{display:"inline-flex"}}>
          {["day","evening"].map(m=>(
            <button key={m} className={`msw-btn ${form.mode===m?"on":""}`}
              onClick={()=>setForm(p=>({...p,mode:m,groups:[],slot:0,lecId:"",roomId:""}))}>
              {m==="day"?t.day:t.evening}
            </button>
          ))}
        </div>
      </div>
      <div className="fg">
        <label className="fl">{t.course} <span className="req">*</span></label>
        <select className="fs" value={form.courseId} onChange={e=>set("courseId",e.target.value)}>
          <option value="">{lang==="fr"?"Sélectionner...":"Select..."}</option>
          {COURSES.map(c=><option key={c.id} value={c.id}>{c.code} — {lang==="fr"?c.fr:c.en}</option>)}
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="fg">
        <div>
          <label className="fl">{t.dayLbl} <span className="req">*</span></label>
          <select className="fs" value={form.day} onChange={e=>set("day",Number(e.target.value))}>
            {(lang==="fr"?DAYS_FR:DAYS_EN).map((d,i)=><option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="fl">{t.slot} <span className="req">*</span></label>
          <select className="fs" value={form.slot} onChange={e=>set("slot",Number(e.target.value))}>
            {slots.map((s,i)=><option key={i} value={i}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="fg">
        <label className="fl">{t.lecturer} <span className="req">*</span></label>
        <select className="fs" value={form.lecId} onChange={e=>set("lecId",e.target.value)}>
          <option value="">{lang==="fr"?"Sélectionner...":"Select..."}</option>
          {validLecs.map(l=><option key={l.id} value={l.id}>{l.full} ({t[l.type]||l.type})</option>)}
        </select>
      </div>
      <div className="fg">
        <label className="fl">
          {t.room} <span className="req">*</span>
          {selRoom&&<span style={{fontSize:10,color:"var(--n500)",fontWeight:400,marginLeft:4}}>
            cap.{selRoom.cap}
            {totalStudents>0&&` · ${totalStudents} ${t.students}`}
            {totalStudents>selRoom.cap&&<span style={{color:"var(--r600)",fontWeight:700}}> ⚠</span>}
          </span>}
        </label>
        <select className="fs" value={form.roomId} onChange={e=>set("roomId",e.target.value)}>
          <option value="">{lang==="fr"?"Sélectionner...":"Select..."}</option>
          {validRooms.map(r=><option key={r.id} value={r.id}>{r.name} ({r.cap} {lang==="fr"?"pl.":"seats"})</option>)}
        </select>
      </div>
      <div className="fg">
        <label className="fl">
          {t.groups} <span className="req">*</span>
          {form.groups.length>1&&<span className="badge b-a" style={{marginLeft:5}}>{t.combined}</span>}
        </label>
        <div className="group-picker">
          {validGroups.map(g=>(
            <div key={g.id} className={`gp-item ${form.groups.includes(g.id)?"sel":""}`} onClick={()=>toggleGroup(g.id)}>
              <div className={`gp-chk ${form.groups.includes(g.id)?"on":""}`}>{form.groups.includes(g.id)&&IC.check}</div>
              <div className="gp-name">{g.name}</div>
              <div className="gp-cnt">{g.count} {t.students}</div>
            </div>
          ))}
        </div>
        {form.groups.length>0&&<div style={{fontSize:11,color:"var(--n600)",marginTop:4}}>
          Total: <strong>{totalStudents}</strong> {t.students}
          {selRoom&&totalStudents<=selRoom.cap&&<span style={{color:"var(--g600)",marginLeft:6}}>✓ {selRoom.name}</span>}
        </div>}
      </div>
      {proposal&&(
        <div className={`cf-preview ${cfls.length===0?"cf-ok":"cf-err"}`}>
          <div className={`cf-title ${cfls.length===0?"":"err"}`} style={{color:cfls.length===0?"var(--g700)":"var(--r600)"}}>
            {cfls.length===0?`✓ ${t.noConflict}`:`⚠ ${t.conflictsFound} (${cfls.length})`}
          </div>
          {cfls.map((c,i)=>(
            <div key={i} className="cf-item" style={{color:"var(--r600)"}}>
              <span>•</span><span>{lang==="fr"?c.msg_fr:c.msg_en}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mfoot" style={{padding:"14px 0 0",marginTop:6}}>
        {isEdit&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(true)}>{IC.trash} {t.delete}</button>}
        <div style={{flex:1}}/>
        <button className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={()=>{
          onSave({
            id:initial?.id||(Date.now().toString()),
            courseId:form.courseId,lecId:form.lecId,roomId:form.roomId,
            day:Number(form.day),slot:Number(form.slot),
            groups:form.groups,combined:form.groups.length>1,
            mode:form.mode,locked:initial?.locked||false,
          });
          onClose();
        }}>{IC.check} {t.save}</button>
      </div>
    </>
  );
}

// ── SESSION DETAIL ─────────────────────────────────────────────────────────────
function SessionDetail({session,lang,onEdit,onClose,onToggleLock,conflicts,onCancel}) {
  const t = T[lang];
  const course = COURSES.find(c=>c.id===session.courseId);
  const lec = LECTURERS.find(l=>l.id===session.lecId);
  const room = ROOMS.find(r=>r.id===session.roomId);
  const grps = session.groups.map(gid=>GROUPS.find(g=>g.id===gid));
  const total = grps.reduce((s,g)=>s+(g?.count||0),0);
  const slots = session.mode==="day"
    ? (session.day===5 ? SAT_SLOTS : DAY_SLOTS)
    : EVE_SLOTS;
  const days = lang==="fr"?DAYS_FR:DAYS_EN;
  const sessConflicts = conflicts.filter(c=>c.sessIds.includes(session.id));
  return (
    <>
      {sessConflicts.length>0&&(
        <div className="alert alert-r" style={{marginBottom:12}}>
          {IC.alert}
          <div>
            {sessConflicts.map((c,i)=><div key={i}>• {lang==="fr"?c.msg_fr:c.msg_en}</div>)}
          </div>
        </div>
      )}
      <div className="dp-grid">
        <div className="dp-f"><div className="dp-k">{t.course}</div><div className="dp-v">{lang==="fr"?course?.fr:course?.en}</div></div>
        <div className="dp-f"><div className="dp-k">Code</div><div className="dp-v" style={{fontFamily:"monospace",color:"var(--b600)"}}>{course?.code}</div></div>
        <div className="dp-f"><div className="dp-k">{t.dayLbl}</div><div className="dp-v">{days[session.day]}</div></div>
        <div className="dp-f"><div className="dp-k">{t.slot}</div><div className="dp-v">{slots[session.slot]}</div></div>
        <div className="dp-f"><div className="dp-k">{t.lecturer}</div><div className="dp-v">{lec?.full}</div></div>
        <div className="dp-f"><div className="dp-k">{t.room}</div><div className="dp-v">{room?.name} <span style={{fontSize:11,color:"var(--n500)"}}>(cap.{room?.cap})</span></div></div>
      </div>
      <div className="dp-f" style={{marginBottom:12}}>
        <div className="dp-k">{t.groups} — {total} {t.students}</div>
        <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
          {grps.map(g=>g&&<span key={g.id} className={`gp ${session.mode==="evening"?"eve":""} ${session.combined?"comb":""}`}>{g.name}</span>)}
        </div>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4}}>
        {session.combined&&<span className="badge b-a">{t.combined}</span>}
        {session.locked&&<span className="badge b-n">{t.locked}</span>}
        <span className={`badge ${session.mode==="day"?"b-g":"b-b"}`}>{session.mode==="day"?t.day:t.evening}</span>
      </div>
      <div className="mfoot" style={{padding:"14px 0 0"}}>
        <button className="btn btn-outline btn-sm" onClick={()=>onToggleLock(session.id)}>
          {IC.lock} {session.locked?t.unlockToggle:t.lockToggle}
        </button>
        {!session.locked&&!session.status&&(
          <button className="btn btn-danger btn-sm" style={{marginLeft:6}} onClick={()=>onCancel(session)}>
            {IC.cancel} {t.cancelSession}
          </button>
        )}
        <div style={{flex:1}}/>
        <button className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
        {!session.locked&&!session.status&&<button className="btn btn-primary" onClick={onEdit}>{IC.edit} {lang==="fr"?"Modifier":"Edit"}</button>}
      </div>
    </>
  );
}

// ── PAGES ──────────────────────────────────────────────────────────────────────

function DashboardPage({t,lang,sessions,conflicts,hardCount,setPage,generated}) {
  const activeSessions = sessions.filter(s => s.status !== "cancelled");
  const dayGroups = GROUPS.filter(g=>g.mode==="day").length;
  const eveGroups = GROUPS.filter(g=>g.mode==="evening").length;
  const vacataires = LECTURERS.filter(l=>l.type==="vacataire"||l.type==="visiting").length;
  const combinedSessions = activeSessions.filter(s=>s.combined).length;
  return (
    <div>
      <div className="sh" style={{marginBottom:20}}>
        <div>
          <div className="sh-title">{lang==="fr"?"Bienvenue sur UniSchedule":"Welcome to UniSchedule"}</div>
          <div className="sh-sub">{t.inst} — {t.semester}</div>
        </div>
      </div>
      {hardCount>0&&(
        <div className="alert alert-r" style={{cursor:"pointer"}} onClick={()=>setPage("conflicts")}>
          {IC.alert}
          <div><strong>{lang==="fr"?"Conflits critiques détectés":"Critical conflicts detected"}</strong> — {hardCount} {lang==="fr"?"conflit(s) dans l'emploi du temps. Cliquez pour voir.":"conflict(s) in the timetable. Click to review."}</div>
        </div>
      )}
      {generated&&hardCount===0&&(
        <div className="alert alert-g">
          {IC.check}
          <strong>{lang==="fr"?"Emploi du temps généré avec succès — aucun conflit critique.":"Timetable generated successfully — no critical conflicts."}</strong>
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card sa-g" onClick={()=>setPage("groups")}>
          <div className="stat-label">{t.totalGroups}</div>
          <div className="stat-val">{GROUPS.length}</div>
          <div className="stat-sub">{dayGroups} {t.day.toLowerCase()} · {eveGroups} {t.evening.toLowerCase()}</div>
        </div>
        <div className="stat-card sa-a" onClick={()=>setPage("lecturers")}>
          <div className="stat-label">{t.totalLecs}</div>
          <div className="stat-val">{LECTURERS.length}</div>
          <div className="stat-sub">{vacataires} vacataires</div>
        </div>
        <div className="stat-card sa-b" onClick={()=>setPage("rooms")}>
          <div className="stat-label">{t.totalRooms}</div>
          <div className="stat-val">{ROOMS.length}</div>
          <div className="stat-sub">{ROOMS.filter(r=>r.eve).length} {lang==="fr"?"dispo. soirée":"avail. evening"}</div>
        </div>
        <div className="stat-card sa-r" onClick={()=>setPage("conflicts")}>
          <div className="stat-label">{t.hardConflicts}</div>
          <div className="stat-val" style={{color:hardCount>0?"var(--r500)":"var(--g600)"}}>{hardCount}</div>
          <div className="stat-sub">{conflicts.filter(c=>c.severity==="soft").length} {t.warnings}</div>
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <div className="card-hdr"><div className="card-title">{lang==="fr"?"Séances planifiées":"Scheduled sessions"}</div><span className="badge b-g">{activeSessions.length}</span></div>
          <div style={{padding:"8px 0"}}>
            {[
              {label:lang==="fr"?"Journée":"Day sessions",count:activeSessions.filter(s=>s.mode==="day").length,color:"var(--g500)"},
              {label:lang==="fr"?"Soirée":"Evening sessions",count:activeSessions.filter(s=>s.mode==="evening").length,color:"var(--b400)"},
              {label:lang==="fr"?"Combinées":"Combined",count:combinedSessions,color:"var(--a400)"},
              {label:lang==="fr"?"Verrouillées":"Locked",count:activeSessions.filter(s=>s.locked).length,color:"var(--n400)"},
            ].map(row=>(
              <div key={row.label} style={{display:"flex",alignItems:"center",padding:"8px 20px",gap:10}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:row.color,flexShrink:0}}/>
                <div style={{fontSize:13,color:"var(--n700)",flex:1}}>{row.label}</div>
                <div style={{fontSize:15,fontWeight:700,color:row.color}}>{row.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-hdr"><div className="card-title">{lang==="fr"?"Charge enseignants":"Lecturer load"}</div></div>
          <div style={{padding:"6px 0"}}>
            {LECTURERS.map(lec=>{
              const h = activeSessions.filter(s=>s.lecId===lec.id).length * 2;
              const pct = Math.min(Math.round((h/lec.maxH)*100),100);
              return (
                <div key={lec.id} className="load-row">
                  <div className="load-top">
                    <span style={{fontWeight:600,fontSize:12}}>{lec.name}</span>
                    <span style={{color:"var(--n500)"}}>{h}h / {lec.maxH}h</span>
                  </div>
                  <div className="load-bar">
                    <div className="load-fill" style={{width:`${pct}%`,background:pct>85?"var(--r500)":pct>65?"var(--a400)":"var(--g500)"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimetablePage({t,lang,sessions,setSessions,conflicts,mode,setMode,setModal,showToast}) {
  const [dragging,setDragging]=useState(null);
  const [dropTarget,setDropTarget]=useState(null);
  const dragRef=useRef(null);
  const days=lang==="fr"?DAYS_FR:DAYS_EN;
  const slots=mode==="day"?DAY_SLOTS:EVE_SLOTS;
  const conflictIds=new Set(conflicts.filter(c=>c.severity==="hard").flatMap(c=>c.sessIds));
  // Only show non-cancelled sessions on the grid
  const filtered=sessions.filter(s=>s.mode===mode && s.status!=="cancelled");

  const getAt=(day,slot)=>filtered.filter(s=>s.day===day&&s.slot===slot);

  const onDragStart=(e,sess)=>{
    if(sess.locked){e.preventDefault();showToast(t.lockedMsg,"warn");return;}
    dragRef.current=sess;setDragging(sess.id);e.dataTransfer.effectAllowed="move";
  };
  const onDragEnd=()=>{setDragging(null);setDropTarget(null);dragRef.current=null;};
  const onDragOver=(e,day,slot)=>{e.preventDefault();setDropTarget({day,slot});};
  const onDragLeave=()=>setDropTarget(null);
  const onDrop=(e,day,slot)=>{
    e.preventDefault();setDropTarget(null);setDragging(null);
    const sess=dragRef.current;if(!sess){return;}
    if(sess.day===day&&sess.slot===slot){dragRef.current=null;return;}
    const updated={...sess,day,slot};
    const nc=checkProposal(sessions,sess.id,updated);
    if(nc.filter(c=>c.severity==="hard").length>0){
      showToast(`${t.conflictBlocked}: ${lang==="fr"?nc[0].msg_fr:nc[0].msg_en}`,"err");
      dragRef.current=null;return;
    }
    setSessions(prev=>prev.map(s=>s.id===sess.id?updated:s));
    showToast(t.movedOk,"ok");dragRef.current=null;
  };

  const getCellState=(day,slot)=>{
    if(!dropTarget||dropTarget.day!==day||dropTarget.slot!==slot) return null;
    const sess=dragRef.current;if(!sess) return "empty";
    const nc=checkProposal(sessions,sess.id,{...sess,day,slot});
    return nc.filter(c=>c.severity==="hard").length>0?"conflict":"ok";
  };

  const openDetail=sess=>setModal({type:"detail",session:sess});
  const openAdd=(day,slot)=>setModal({type:"add",day,slot,mode});

  return (
    <div>
      <div className="sh">
        <div>
          <div className="sh-title">{t.timetable}</div>
          <div className="sh-sub">{t.dragInfo}</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setModal({type:"add",day:0,slot:0,mode})}>
          {IC.plus} {t.addSession}
        </button>
      </div>
      <div className="tt-controls">
        <div className="mode-sw">
          <button className={`msw-btn ${mode==="day"?"on":""}`} onClick={()=>setMode("day")}>{t.day} 07h–17h</button>
          <button className={`msw-btn ${mode==="evening"?"on":""}`} onClick={()=>setMode("evening")}>{t.evening} 18h–22h</button>
        </div>
        <div className="legend">
          <div className="leg"><div className="leg-dot" style={{background:"var(--g300)"}}/>{t.day}</div>
          <div className="leg"><div className="leg-dot" style={{background:"var(--b400)"}}/>{t.evening}</div>
          <div className="leg"><div className="leg-dot" style={{background:"var(--a400)"}}/>{t.combined}</div>
          <div className="leg"><div className="leg-dot" style={{background:"var(--r500)"}}/>{lang==="fr"?"Conflit":"Conflict"}</div>
        </div>
      </div>
      <div className="tt-wrap">
        <div className="tt-scroll">
          <table className="tt-table">
            <thead>
              <tr>
                <th>{lang==="fr"?"Créneau":"Slot"}</th>
                {days.map(d=><th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {slots.map((slotLabel,si)=>(
                <tr key={si}>
                  <td>{slotLabel.split("–")[0]}<br/><span style={{opacity:.6}}>–{slotLabel.split("–")[1]}</span></td>
                  {[0,1,2,3,4].map(di=>{
                    const cellSessions=getAt(di,si);
                    const cs=getCellState(di,si);
                    return (
                      <td key={di}
                        className={`${mode==="evening"?"eve-bg":""} ${cs==="conflict"?"cell-drop-conflict":""} ${cs==="ok"?"cell-drop-ok":""} ${cs==="empty"?"cell-drop":""}`}
                        onDragOver={e=>onDragOver(e,di,si)}
                        onDragLeave={onDragLeave}
                        onDrop={e=>onDrop(e,di,si)}>
                        <div className="tt-cell-inner">
                          {cellSessions.map(sess=>{
                            const isConf=conflictIds.has(sess.id);
                            return (
                              <div key={sess.id}
                                draggable={!sess.locked}
                                onDragStart={e=>onDragStart(e,sess)}
                                onDragEnd={onDragEnd}
                                className={`sc ${mode==="evening"?"eve-s":"day-s"} ${sess.combined?"comb-s":""} ${isConf?"conf-s":""} ${sess.locked?"lock-s":""} ${dragging===sess.id?"dragging":""} ${sess.status==="cancelled"?"cancelled-s":""} ${sess.isSubstitute?"sub-s":""} ${sess.isMakeup?"makeup-s":""}`}
                                onClick={()=>openDetail(sess)}>
                                {sess.combined&&<span className="comb-tag">COMB</span>}
                                {sess.locked&&<span className="lock-tag">🔒</span>}
                                {sess.isSubstitute&&<span className="sub-tag">SUB</span>}
                                {sess.isMakeup&&<span className="makeup-tag">RAT</span>}
                                {sess.status==="cancelled"&&<span className="cancel-tag">✗</span>}
                                <div className="sc-code">{COURSES.find(c=>c.id===sess.courseId)?.code}</div>
                                <div className="sc-name">{lang==="fr"?COURSES.find(c=>c.id===sess.courseId)?.fr:COURSES.find(c=>c.id===sess.courseId)?.en}</div>
                                <div className="sc-meta">{ROOMS.find(r=>r.id===sess.roomId)?.name} · {LECTURERS.find(l=>l.id===sess.lecId)?.name}</div>
                                <div className="sc-groups">
                                  {sess.groups.map(gid=><span key={gid} className={`gp ${mode==="evening"?"eve":""} ${sess.combined?"comb":""}`}>{GROUPS.find(g=>g.id===gid)?.name.split("-")[0]}</span>)}
                                </div>
                              </div>
                            );
                          })}
                          {!cellSessions.length&&(
                            <div className="add-hint" onClick={()=>openAdd(di,si)}>
                              {IC.plus} <span>{t.clickToAdd}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {conflicts.length>0&&(
        <div style={{marginTop:16}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--r600)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>
            {conflicts.length} {lang==="fr"?"conflit(s) actif(s)":"active conflict(s)"}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {conflicts.slice(0,4).map((c,i)=>(
              <div key={i} style={{background:"var(--white)",border:"1px solid",borderColor:c.severity==="hard"?"var(--r200)":"var(--a200)",borderLeft:`3px solid ${c.severity==="hard"?"var(--r500)":"var(--a400)"}`,borderRadius:"var(--r8)",padding:"7px 12px",fontSize:12,display:"flex",alignItems:"center",gap:8}}>
                <span className={`badge ${c.severity==="hard"?"b-r":"b-a"}`}>{c.severity==="hard"?t.hard:t.soft}</span>
                {lang==="fr"?c.msg_fr:c.msg_en}
              </div>
            ))}
            {conflicts.length>4&&<div style={{fontSize:11,color:"var(--n500)"}}>{lang==="fr"?`+${conflicts.length-4} autres conflits`:`+${conflicts.length-4} more conflicts`}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsPage({t,lang,sessions}) {
  const [tab,setTab]=useState("all");
  const filtered=tab==="all"?GROUPS:GROUPS.filter(g=>g.mode===tab);
  return (
    <div>
      <div className="sh"><div><div className="sh-title">{t.groups}</div><div className="sh-sub">{GROUPS.length} {lang==="fr"?"groupes enregistrés":"registered groups"}</div></div></div>
      <div className="tabs">
        {["all","day","evening"].map(tb=>(
          <div key={tb} className={`tab ${tab===tb?"on":""}`} onClick={()=>setTab(tb)}>
            {tb==="all"?t.all:tb==="day"?t.day:t.evening} ({tb==="all"?GROUPS.length:GROUPS.filter(g=>g.mode===tb).length})
          </div>
        ))}
      </div>
      <div className="card">
        <table className="dt">
          <thead><tr>
            <th>{t.groups}</th><th>Programme</th><th>Niveau</th><th>Mode</th>
            <th>{lang==="fr"?"Effectif":"Enrollment"}</th>
            <th>{lang==="fr"?"Séances":"Sessions"}</th>
            <th>{lang==="fr"?"Combinées":"Combined"}</th>
          </tr></thead>
          <tbody>
            {filtered.map(g=>{
              const gSess=sessions.filter(s=>s.groups.includes(g.id) && s.status!=="cancelled");
              const gComb=gSess.filter(s=>s.combined).length;
              return (
                <tr key={g.id}>
                  <td><strong style={{color:"var(--g800)"}}>{g.name}</strong></td>
                  <td style={{color:"var(--n600)"}}>{g.prog}</td>
                  <td><span className="badge b-n">L{g.level}</span></td>
                  <td><span className={`chip ${g.mode==="day"?"chip-d":"chip-e"}`}>{g.mode==="day"?t.day:t.evening}</span></td>
                  <td>{g.count} {t.students}</td>
                  <td><span className="badge b-g">{gSess.length}</span></td>
                  <td>{gComb>0?<span className="badge b-a">{gComb}</span>:<span style={{color:"var(--n400)"}}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LecturersPage({t,lang,sessions}) {
  const [sel,setSel]=useState(null);
  const selLec=LECTURERS.find(l=>l.id===sel);
  const avDays=lang==="fr"?["Lun","Mar","Mer","Jeu","Ven","Sam"]:["Mon","Tue","Wed","Thu","Fri","Sat"];
  return (
    <div>
      <div className="sh"><div><div className="sh-title">{t.lecturers}</div><div className="sh-sub">{LECTURERS.length} {lang==="fr"?"enseignants":"lecturers"}</div></div></div>
      <div className="grid2">
        <div className="card">
          <table className="dt">
            <thead><tr>
              <th>{lang==="fr"?"Nom":"Name"}</th><th>Type</th><th>Mode</th>
              <th>{lang==="fr"?"Max":"Max"}</th><th>{lang==="fr"?"Séances":"Sessions"}</th>
            </tr></thead>
            <tbody>
              {LECTURERS.map(lec=>{
                const h=sessions.filter(s=>s.lecId===lec.id).length*2;
                const tc={permanent:"b-g",vacataire:"b-a",visiting:"b-b"}[lec.type]||"b-n";
                const tl=t[lec.type]||lec.type;
                return (
                  <tr key={lec.id} style={{cursor:"pointer",background:sel===lec.id?"var(--g50)":""}} onClick={()=>setSel(sel===lec.id?null:lec.id)}>
                    <td>
                      <div style={{fontWeight:600}}>{lec.full}</div>
                      <div style={{fontSize:11,color:"var(--n500)"}}>{lec.phone}</div>
                    </td>
                    <td><span className={`badge ${tc}`}>{tl}</span></td>
                    <td style={{fontSize:11}}>
                      {lec.day&&<span className="chip chip-d" style={{fontSize:9,marginRight:3}}>{t.day}</span>}
                      {lec.eve&&<span className="chip chip-e" style={{fontSize:9}}>{t.evening}</span>}
                    </td>
                    <td style={{color:"var(--n500)"}}>{lec.maxH}h</td>
                    <td><span className="badge b-g">{sessions.filter(s=>s.lecId===lec.id && s.status!=="cancelled").length}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">{selLec?`${t.availability} — ${selLec.name}`:t.selectLec}</div>
          </div>
          <div className="card-body">
            {!selLec?(
              <div className="empty">{IC.users}<p>{lang==="fr"?"Cliquez sur un enseignant pour voir ses disponibilités":"Click a lecturer to view availability"}</p></div>
            ):(
              <>
                <div className="av-grid" style={{marginBottom:10}}>
                  <div className="av-hdr"/>
                  {avDays.map(d=><div key={d} className="av-hdr">{d}</div>)}
                  {AV_SLOTS.map((slot,si)=>(
                    <>
                      <div key={`l${si}`} className="av-lbl">{slot}</div>
                      {[0,1,2,3,4,5].map(di=>{
                        const av=selLec.avail[di]?.[si];
                        const isEve=si===5;
                        return <div key={`${di}${si}`} className={`av-cell ${av?(isEve?"av-eve":"av-y"):"av-n"}`}>{av?(isEve?"🌙":"✓"):"—"}</div>;
                      })}
                    </>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span className="chip chip-d">✓ {lang==="fr"?"Disponible":"Available"}</span>
                  <span className="chip chip-e">🌙 {lang==="fr"?"Soirée":"Evening"}</span>
                  <span className="badge b-n">— {lang==="fr"?"Indisponible":"Unavailable"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomsPage({t,lang,sessions}) {
  return (
    <div>
      <div className="sh"><div><div className="sh-title">{t.rooms}</div><div className="sh-sub">{ROOMS.length} {lang==="fr"?"salles":"rooms"}</div></div></div>
      <div className="card">
        <table className="dt">
          <thead><tr>
            <th>{lang==="fr"?"Salle":"Room"}</th><th>Type</th>
            <th>{t.capacity}</th><th>Faculté</th>
            <th>{t.eveningOk}</th>
            <th>{lang==="fr"?"Séances":"Sessions"}</th>
            <th>{lang==="fr"?"Occupation":"Occupancy"}</th>
          </tr></thead>
          <tbody>
            {ROOMS.map(room=>{
              const rs=sessions.filter(s=>s.roomId===room.id && s.status!=="cancelled").length;
              const pct=Math.round((rs/25)*100);
              const tc={amphitheater:"b-b",classroom:"b-g",lab:"b-a"}[room.type]||"b-n";
              const tl=t[room.type]||room.type;
              return (
                <tr key={room.id}>
                  <td><strong style={{color:"var(--g800)"}}>{room.name}</strong></td>
                  <td><span className={`badge ${tc}`}>{tl}</span></td>
                  <td>{room.cap} {t.students}</td>
                  <td>{room.faculty==="Shared"?<span className="badge b-n">{t.shared}</span>:<span style={{color:"var(--n600)",fontSize:12}}>{room.faculty}</span>}</td>
                  <td>{room.eve?<span style={{color:"var(--g600)",fontWeight:700}}>✓</span>:<span style={{color:"var(--n400)"}}>✗</span>}</td>
                  <td><span className="badge b-g">{rs}</span></td>
                  <td style={{minWidth:110}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{flex:1,height:5,background:"var(--n100)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:pct>75?"var(--r500)":pct>50?"var(--a400)":"var(--g500)",borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:11,color:"var(--n500)",minWidth:28}}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConflictsPage({t,lang,conflicts,sessions}) {
  const [filter,setFilter]=useState("all");
  const filtered=filter==="all"?conflicts:conflicts.filter(c=>c.severity===filter);
  const typeLabels={
    LECTURER_DOUBLE_BOOKED:lang==="fr"?"Enseignant double-réservé":"Lecturer double-booked",
    ROOM_DOUBLE_BOOKED:lang==="fr"?"Salle double-réservée":"Room double-booked",
    GROUP_CLASH:lang==="fr"?"Conflit de groupe":"Group clash",
    CAPACITY_EXCEEDED:lang==="fr"?"Capacité dépassée":"Capacity exceeded",
    ROOM_NO_EVENING:lang==="fr"?"Salle indisponible le soir":"Room unavailable evenings",
    LECTURER_NO_EVENING:lang==="fr"?"Enseignant indisponible le soir":"Lecturer unavailable evenings",
    LECTURER_FATIGUE:lang==="fr"?"Fatigue enseignant":"Lecturer fatigue",
  };
  return (
    <div>
      <div className="sh"><div><div className="sh-title">{t.conflicts}</div><div className="sh-sub">{conflicts.length} {lang==="fr"?"conflit(s) détecté(s)":"conflict(s) detected"}</div></div></div>
      {conflicts.length===0?(
        <div className="card"><div className="card-body"><div className="empty">{IC.check}<p style={{color:"var(--g600)",fontWeight:600}}>{t.noConflicts}</p></div></div></div>
      ):(
        <>
          <div className="tabs">
            {["all","hard","soft"].map(f=>(
              <div key={f} className={`tab ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>
                {f==="all"?t.all:f==="hard"?t.hard:t.soft} ({f==="all"?conflicts.length:conflicts.filter(c=>c.severity===f).length})
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{padding:"6px 20px"}}>
              {filtered.map(c=>(
                <div key={c.id} className="cf-item-row">
                  <div className={`cf-icon ${c.severity}`}>
                    <svg viewBox="0 0 16 16" fill={c.severity==="hard"?"var(--r600)":"var(--a500)"}>
                      <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575zm1.763.707a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368zm.53 3.996v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 011.5 0zM9 11a1 1 0 11-2 0 1 1 0 012 0z"/>
                    </svg>
                  </div>
                  <div style={{flex:1}}>
                    <div className={`cf-type ${c.severity}`}>{c.severity==="hard"?t.hard:t.soft} — {typeLabels[c.type]||c.type}</div>
                    <div className="cf-desc">{lang==="fr"?c.msg_fr:c.msg_en}</div>
                    <div className="cf-meta">
                      {t.affectedSessions}: {c.sessIds.map(sid=>{
                        const s=sessions.find(x=>x.id===sid);
                        return s?`${COURSES.find(c=>c.id===s.courseId)?.code||"?"} (${s.mode==="day"?t.day:t.evening})`:sid;
                      }).join(" · ")}
                    </div>
                  </div>
                  <span className={`badge ${c.severity==="hard"?"b-r":"b-a"}`}>{c.severity==="hard"?t.hard:t.soft}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── SUBSTITUTION & MAKEUP HELPERS ─────────────────────────────────────────────
const SAT_SLOTS = ["08:00–10:00","10:00–12:00"];
const SAT_SLOT_LABELS_FR = ["Sam 08:00–10:00","Sam 10:00–12:00"];
const SAT_SLOT_LABELS_EN = ["Sat 08:00–10:00","Sat 10:00–12:00"];

function findEligibleSubs(session, sessions, allLecturers) {
  // Find lecturers who: teach the right mode, are NOT already booked at this slot
  const busyLecIds = sessions
    .filter(s => s.id !== session.id && s.day === session.day && s.slot === session.slot && s.status !== "cancelled")
    .map(s => s.lecId);
  return allLecturers.filter(l => {
    if (l.id === session.lecId) return false; // exclude original
    if (session.mode === "evening" && !l.eve) return false;
    if (session.mode === "day" && !l.day) return false;
    if (busyLecIds.includes(l.id)) return false;
    return true;
  });
}

function findMakeupSlots(session, sessions, lang) {
  // Suggest: Saturday slots first, then any weekday slot where all groups + room are free
  const occupied = new Set(
    sessions
      .filter(s => s.status !== "cancelled" && s.id !== session.id)
      .map(s => `${s.day}-${s.slot}-${s.mode}`)
  );
  const groupConflicts = (day, slot, mode) => sessions.some(s =>
    s.id !== session.id && s.status !== "cancelled" &&
    s.day === day && s.slot === slot &&
    s.groups.some(g => session.groups.includes(g))
  );
  const roomFree = (day, slot) => !sessions.some(s =>
    s.id !== session.id && s.status !== "cancelled" &&
    s.day === day && s.slot === slot && s.roomId === session.roomId
  );
  const slots = [];
  // Saturday makeup slots (day=5)
  SAT_SLOTS.forEach((slotLabel, si) => {
    if (!groupConflicts(5, si, "day") && roomFree(5, si)) {
      slots.push({ day: 5, slot: si, isSat: true, label: lang === "fr" ? SAT_SLOT_LABELS_FR[si] : SAT_SLOT_LABELS_EN[si] });
    }
  });
  // Weekday slots
  const wDays = lang === "fr" ? DAYS_FR : DAYS_EN;
  const modeSlots = session.mode === "day" ? DAY_SLOTS : EVE_SLOTS;
  for (let d = 0; d < 5; d++) {
    modeSlots.forEach((slotLabel, si) => {
      if (!groupConflicts(d, si, session.mode) && roomFree(d, si) && !occupied.has(`${d}-${si}-${session.mode}`)) {
        slots.push({ day: d, slot: si, isSat: false, label: `${wDays[d]} ${slotLabel}` });
      }
    });
  }
  return slots.slice(0, 8);
}

function buildSmsText(session, subLec, lang) {
  const course = COURSES.find(c => c.id === session.courseId);
  const room = ROOMS.find(r => r.id === session.roomId);
  const days = lang === "fr" ? DAYS_FR : DAYS_EN;
  const slots = session.mode === "day" ? DAY_SLOTS : EVE_SLOTS;
  const courseName = lang === "fr" ? course?.fr : course?.en;
  if (subLec) {
    return lang === "fr"
      ? `[ISIMA] Le cours "${courseName}" du ${days[session.day]} (${slots[session.slot]}) sera assuré par ${subLec.full} en salle ${room?.name}. Merci.`
      : `[ISIMA] The class "${courseName}" on ${days[session.day]} (${slots[session.slot]}) will be taught by ${subLec.full} in ${room?.name}. Thank you.`;
  }
  return lang === "fr"
    ? `[ISIMA] Le cours "${courseName}" du ${days[session.day]} (${slots[session.slot]}) est annulé. Un rattrapage sera planifié. Merci.`
    : `[ISIMA] The class "${courseName}" on ${days[session.day]} (${slots[session.slot]}) is cancelled. A make-up will be scheduled. Thank you.`;
}

// ── CANCEL + SUBSTITUTE MODAL ─────────────────────────────────────────────────
function CancelSubstituteModal({ session, sessions, lang, onClose, onConfirm }) {
  const t = T[lang];
  const [step, setStep] = useState(1); // 1=cancel, 2=substitute, 3=makeup
  const [reason, setReason] = useState("");
  const [selSub, setSelSub] = useState(null);
  const [selMakeup, setSelMakeup] = useState(null);
  const [smsVisible, setSmsVisible] = useState(false);

  const course = COURSES.find(c => c.id === session.courseId);
  const origLec = LECTURERS.find(l => l.id === session.lecId);
  const room = ROOMS.find(r => r.id === session.roomId);
  const days = lang === "fr" ? DAYS_FR : DAYS_EN;
  const slots = session.mode === "day" ? DAY_SLOTS : EVE_SLOTS;
  const grps = session.groups.map(gid => GROUPS.find(g => g.id === gid));

  const eligibleSubs = findEligibleSubs(session, sessions, LECTURERS);
  const makeupSlots = findMakeupSlots(session, sessions, lang);
  const subLec = LECTURERS.find(l => l.id === selSub);
  const smsText = buildSmsText(session, subLec, lang);

  const initials = (name) => name.split(" ").filter(w => w.match(/[A-Z]/)).map(w => w[0]).join("").slice(0, 2);

  const handleConfirm = () => {
    onConfirm({ session, reason, subLecId: selSub, makeupSlot: selMakeup });
    onClose();
  };

  return (
    <>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: "var(--r8)", overflow: "hidden", border: "1px solid var(--n200)" }}>
        {[t.step1, t.step2, t.step3].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 10, fontWeight: 700,
            background: step === i + 1 ? "var(--g800)" : step > i + 1 ? "var(--g100)" : "var(--n50)",
            color: step === i + 1 ? "var(--white)" : step > i + 1 ? "var(--g700)" : "var(--n400)",
            borderRight: i < 2 ? "1px solid var(--n200)" : "none",
            transition: "all .2s", cursor: step > i + 1 ? "pointer" : "default",
          }} onClick={() => step > i + 1 && setStep(i + 1)}>
            {step > i + 1 ? "✓ " : ""}{label}
          </div>
        ))}
      </div>

      {/* Session info card */}
      <div style={{ background: "var(--r50)", border: "1px solid var(--r200)", borderRadius: "var(--r8)", padding: "10px 14px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--r600)" }}>{lang === "fr" ? course?.fr : course?.en}</div>
          <div style={{ fontSize: 11, color: "var(--n600)", marginTop: 2 }}>{days[session.day]} · {slots[session.slot]} · {room?.name} · {origLec?.name}</div>
          <div style={{ fontSize: 11, color: "var(--n500)", marginTop: 2 }}>{grps.map(g => g?.name).join(", ")}</div>
        </div>
        <span className="badge b-r">{t.cancelledBadge}</span>
      </div>

      {/* STEP 1 — REASON */}
      {step === 1 && (
        <div className="sub-step">
          <div className="sub-step-title">{t.cancelReason}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {t.reasonOptions.map(r => (
              <div key={r} onClick={() => setReason(r)}
                style={{ padding: "9px 12px", borderRadius: "var(--r8)", border: `1.5px solid ${reason === r ? "var(--g600)" : "var(--n200)"}`, background: reason === r ? "var(--g50)" : "var(--white)", cursor: "pointer", fontSize: 13, fontWeight: reason === r ? 600 : 400, color: reason === r ? "var(--g800)" : "var(--n800)", display: "flex", alignItems: "center", gap: 8, transition: "all .12s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${reason === r ? "var(--g600)" : "var(--n300)"}`, background: reason === r ? "var(--g600)" : "transparent", flexShrink: 0 }} />
                {r}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-danger" disabled={!reason} onClick={() => setStep(2)}>{IC.cancel} {t.cancelSession}</button>
          </div>
        </div>
      )}

      {/* STEP 2 — SUBSTITUTE */}
      {step === 2 && (
        <div className="sub-step">
          <div className="sub-step-title">{t.eligibleSubs} ({eligibleSubs.length})</div>
          {eligibleSubs.length === 0 ? (
            <div className="no-sub">{t.noEligibleSubs}</div>
          ) : (
            eligibleSubs.map(lec => (
              <div key={lec.id} className={`sub-lec-card ${selSub === lec.id ? "selected" : ""}`} onClick={() => setSelSub(lec.id)}>
                <div className="sub-lec-avatar">{initials(lec.full)}</div>
                <div style={{ flex: 1 }}>
                  <div className="sub-lec-name">{lec.full}</div>
                  <div className="sub-lec-meta">{t[lec.type] || lec.type} · {lec.phone}</div>
                </div>
                <div className="sub-lec-status">
                  <span className="badge b-g">{lang === "fr" ? "Libre" : "Free"}</span>
                  {lec.eve && <span className="badge b-b" style={{ fontSize: 8 }}>🌙</span>}
                </div>
              </div>
            ))
          )}
          {/* SMS preview toggle */}
          <div style={{ marginTop: 8, cursor: "pointer", fontSize: 11, color: "var(--g600)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }} onClick={() => setSmsVisible(v => !v)}>
            {IC.sms} {t.smsPreview} {smsVisible ? "▲" : "▼"}
          </div>
          {smsVisible && (
            <div className="sms-preview">
              <div className="sms-header">{IC.sms} Africa's Talking SMS</div>
              <div className="sms-bubble">{smsText}</div>
              <div className="sms-meta">{t.sendSmsTo}: {grps.map(g => g?.name).join(", ")}</div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setStep(3)}>{lang === "fr" ? "Passer →" : "Skip →"}</button>
            <button className="btn btn-primary" disabled={!selSub} onClick={() => setStep(3)}>{IC.check} {t.substituteAssign}</button>
          </div>
        </div>
      )}

      {/* STEP 3 — MAKEUP */}
      {step === 3 && (
        <div className="sub-step">
          <div className="sub-step-title">{t.freeSlots} ({makeupSlots.length})</div>
          {makeupSlots.length === 0 ? (
            <div className="no-sub">{t.noFreeSlots}</div>
          ) : (
            makeupSlots.map((ms, i) => (
              <div key={i} className={`makeup-slot ${ms.isSat ? "saturday" : ""} ${selMakeup === i ? "selected" : ""}`} onClick={() => setSelMakeup(selMakeup === i ? null : i)}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${selMakeup === i ? "var(--g600)" : "var(--n300)"}`, background: selMakeup === i ? "var(--g600)" : "transparent", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="ms-day">{ms.label}</div>
                  <div className="ms-time">{room?.name} · {lang === "fr" ? "Même salle" : "Same room"}</div>
                </div>
                {ms.isSat && <span className="ms-sat-badge">{t.saturdaySlot.split(" ")[0]}</span>}
              </div>
            ))
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button className="btn btn-outline" onClick={handleConfirm}>{lang === "fr" ? "Terminer sans rattrapage" : "Finish without make-up"}</button>
            <button className="btn btn-amber" disabled={selMakeup === null} onClick={handleConfirm}>{IC.makeup} {t.scheduleMakeup}</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── GESTION PAGE ──────────────────────────────────────────────────────────────
function GestionPage({ t, lang, logs, sessions }) {
  const [tab, setTab] = useState("log");
  const cancelled = sessions.filter(s => s.status === "cancelled");
  const substituted = sessions.filter(s => s.substituteId);
  const makeups = sessions.filter(s => s.isMakeup);

  const logColors = { cancelled: "var(--r500)", substituted: "var(--p600)", makeup: "var(--a500)", created: "var(--g500)", moved: "var(--b400)" };

  return (
    <div>
      <div className="sh">
        <div>
          <div className="sh-title">{t.gestion}</div>
          <div className="sh-sub">{lang === "fr" ? "Annulations, remplacements, rattrapages" : "Cancellations, substitutions, make-ups"}</div>
        </div>
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <div className="stat-mini">
          <div className="stat-mini-val" style={{ color: "var(--r500)" }}>{cancelled.length}</div>
          <div className="stat-mini-lbl">{t.cancelledSessions}</div>
        </div>
        <div className="stat-mini">
          <div className="stat-mini-val" style={{ color: "var(--p600)" }}>{substituted.length}</div>
          <div className="stat-mini-lbl">{t.substituteAssigned}</div>
        </div>
        <div className="stat-mini">
          <div className="stat-mini-val" style={{ color: "var(--a500)" }}>{makeups.length}</div>
          <div className="stat-mini-lbl">{t.makeupScheduled}</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "log" ? "on" : ""}`} onClick={() => setTab("log")}>{t.auditLog} ({logs.length})</div>
        <div className={`tab ${tab === "cancelled" ? "on" : ""}`} onClick={() => setTab("cancelled")}>{t.cancelledSessions} ({cancelled.length})</div>
        <div className={`tab ${tab === "makeup" ? "on" : ""}`} onClick={() => setTab("makeup")}>{t.makeupScheduled} ({makeups.length})</div>
      </div>

      <div className="card">
        {tab === "log" && (
          <div style={{ padding: "4px 20px" }}>
            {logs.length === 0
              ? <div className="empty" style={{ padding: 30 }}>{IC.log}<p>{t.noLogs}</p></div>
              : logs.slice().reverse().map((log, i) => (
                <div key={i} className="log-item">
                  <div className="log-dot" style={{ background: logColors[log.type] || "var(--n400)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="log-main">{log.msg}</div>
                    <div className="log-meta">{log.detail}</div>
                  </div>
                  <div className="log-time">{log.time}</div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "cancelled" && (
          <table className="dt">
            <thead><tr>
              <th>{lang === "fr" ? "Séance" : "Session"}</th>
              <th>{lang === "fr" ? "Enseignant" : "Lecturer"}</th>
              <th>{lang === "fr" ? "Raison" : "Reason"}</th>
              <th>{lang === "fr" ? "Remplaçant" : "Substitute"}</th>
              <th>{lang === "fr" ? "Statut" : "Status"}</th>
            </tr></thead>
            <tbody>
              {cancelled.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--n400)", padding: 24 }}>{lang === "fr" ? "Aucune séance annulée" : "No cancelled sessions"}</td></tr>
                : cancelled.map(s => {
                  const course = COURSES.find(c => c.id === s.courseId);
                  const lec = LECTURERS.find(l => l.id === s.lecId);
                  const sub = LECTURERS.find(l => l.id === s.substituteId);
                  const days = lang === "fr" ? DAYS_FR : DAYS_EN;
                  const slots = s.mode === "day" ? DAY_SLOTS : EVE_SLOTS;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{lang === "fr" ? course?.fr : course?.en}</div>
                        <div style={{ fontSize: 11, color: "var(--n500)" }}>{days[s.day]} · {slots[s.slot]}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{lec?.name}</td>
                      <td><span className="badge b-n">{s.cancelReason || "—"}</span></td>
                      <td>{sub ? <span style={{ fontSize: 12, fontWeight: 600, color: "var(--p600)" }}>{sub.name}</span> : <span style={{ color: "var(--n400)" }}>—</span>}</td>
                      <td>
                        {sub ? <span className="badge b-p">{t.subBadge}</span> : <span className="badge b-r">{t.cancelledBadge}</span>}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        )}

        {tab === "makeup" && (
          <table className="dt">
            <thead><tr>
              <th>{lang === "fr" ? "Cours de rattrapage" : "Make-up class"}</th>
              <th>{lang === "fr" ? "Nouveau créneau" : "New slot"}</th>
              <th>{lang === "fr" ? "Salle" : "Room"}</th>
              <th>{lang === "fr" ? "Groupes" : "Groups"}</th>
            </tr></thead>
            <tbody>
              {makeups.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--n400)", padding: 24 }}>{lang === "fr" ? "Aucun rattrapage planifié" : "No make-ups scheduled"}</td></tr>
                : makeups.map(s => {
                  const course = COURSES.find(c => c.id === s.courseId);
                  const room = ROOMS.find(r => r.id === s.roomId);
                  const grps = s.groups.map(gid => GROUPS.find(g => g.id === gid));
                  const days = s.day === 5 ? (lang === "fr" ? ["Lun","Mar","Mer","Jeu","Ven","Sam"] : ["Mon","Tue","Wed","Thu","Fri","Sat"]) : (lang === "fr" ? DAYS_FR : DAYS_EN);
                  const slots = s.day === 5 ? SAT_SLOTS : (s.mode === "day" ? DAY_SLOTS : EVE_SLOTS);
                  return (
                    <tr key={s.id}>
                      <td><div style={{ fontWeight: 600, color: "var(--a600)" }}>{lang === "fr" ? course?.fr : course?.en}</div></td>
                      <td>
                        <span className="badge b-a">{t.makeupBadge}</span>
                        <span style={{ fontSize: 12, marginLeft: 6 }}>{days[s.day]} · {slots[s.slot] || "—"}</span>
                      </td>
                      <td style={{ fontSize: 12 }}>{room?.name}</td>
                      <td><div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{grps.map(g => g && <span key={g.id} className="gp">{g.name.split("-")[0]}</span>)}</div></td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTO-GENERATE ALGORITHM
// ══════════════════════════════════════════════════════════════════════════════

const SCHEDULE_REQUESTS = [
  {id:"r1",courseId:"c1",groups:["g1","g2","g3"],combined:true,mode:"day",sessionsPerWeek:1},
  {id:"r2",courseId:"c2",groups:["g1"],combined:false,mode:"day",sessionsPerWeek:2},
  {id:"r3",courseId:"c3",groups:["g2"],combined:false,mode:"day",sessionsPerWeek:1},
  {id:"r4",courseId:"c4",groups:["g4"],combined:false,mode:"evening",sessionsPerWeek:2},
  {id:"r5",courseId:"c5",groups:["g3"],combined:false,mode:"day",sessionsPerWeek:1},
  {id:"r6",courseId:"c6",groups:["g4","g5"],combined:true,mode:"evening",sessionsPerWeek:1},
  {id:"r7",courseId:"c7",groups:["g1"],combined:false,mode:"day",sessionsPerWeek:1},
  {id:"r8",courseId:"c2",groups:["g6"],combined:false,mode:"day",sessionsPerWeek:2},
  {id:"r9",courseId:"c1",groups:["g4","g5"],combined:true,mode:"evening",sessionsPerWeek:1},
  {id:"r10",courseId:"c7",groups:["g6"],combined:false,mode:"day",sessionsPerWeek:1},
];

function requestDifficulty(req) {
  let score = 0;
  if (req.combined) score += 100;
  if (req.mode === "evening") score += 80;
  score += req.groups.length * 20;
  const eligibleLecs = LECTURERS.filter(l => req.mode === "day" ? l.day : l.eve);
  score += (4 - Math.min(eligibleLecs.length, 4)) * 30;
  return score;
}

function pickLecturer(req, day, slot, placed) {
  const busy = new Set(placed.filter(s => s.day === day && s.slot === slot).map(s => s.lecId));
  // Map slot index to availability array index:
  // Day slots 0-4 → avail indices 0-4, Evening slots 0-1 → avail index 5
  const avIdx = req.mode === "evening" ? 5 : slot;
  const eligible = LECTURERS.filter(l => {
    if (req.mode === "day" && !l.day) return false;
    if (req.mode === "evening" && !l.eve) return false;
    if (busy.has(l.id)) return false;
    return l.avail[day]?.[avIdx] === 1;
  });
  if (!eligible.length) return null;
  const prev = placed.find(s => s.courseId === req.courseId && eligible.find(l => l.id === s.lecId));
  if (prev) return prev.lecId;
  return eligible[0].id;
}

function pickRoom(req, day, slot, placed) {
  const busy = new Set(placed.filter(s => s.day === day && s.slot === slot).map(s => s.roomId));
  const totalStudents = req.groups.reduce((sum, gid) => sum + (GROUPS.find(g => g.id === gid)?.count || 0), 0);
  const candidates = ROOMS.filter(r => {
    if (busy.has(r.id)) return false;
    if (r.cap < totalStudents) return false;
    if (req.mode === "evening" && !r.eve) return false;
    return true;
  }).sort((a, b) => a.cap - b.cap);
  return candidates[0]?.id || null;
}

function groupsFree(req, day, slot, placed) {
  return !placed.some(s =>
    s.day === day && s.slot === slot &&
    s.groups.some(g => req.groups.includes(g))
  );
}

function greedyPlace(requests, lockedSessions) {
  // Work on a combined pool for conflict checking, but only count NEW sessions
  const pool = [...lockedSessions];
  const newSessions = [];
  const slotPools = { day: [0,1,2,3,4], evening: [0,1] };
  const sorted = [...requests].sort((a, b) => requestDifficulty(b) - requestDifficulty(a));
  let placed_count = 0, failed = 0;

  for (const req of sorted) {
    const slots = slotPools[req.mode] || slotPools.day;
    let left = req.sessionsPerWeek;
    const used = new Set();

    for (let day = 0; day < 5 && left > 0; day++) {
      for (const slot of slots) {
        if (left <= 0) break;
        const key = `${day}-${slot}`;
        if (used.has(key)) continue;
        if (!groupsFree(req, day, slot, pool)) continue;
        const lecId = pickLecturer(req, day, slot, pool);
        if (!lecId) continue;
        const roomId = pickRoom(req, day, slot, pool);
        if (!roomId) continue;
        const sess = {
          id: `gen-${req.id}-d${day}s${slot}-${Math.random().toString(36).slice(2,6)}`,
          courseId: req.courseId, lecId, roomId,
          day, slot, groups: req.groups,
          combined: req.combined, mode: req.mode,
          locked: false, isGenerated: true,
        };
        pool.push(sess);
        newSessions.push(sess);
        used.add(key);
        left--;
        placed_count++;
      }
    }
    if (left > 0) failed += left;
  }
  // Return locked + new together
  return { sessions: [...lockedSessions, ...newSessions], newSessions, placed_count, failed };
}

function scoreSolution(sessions) {
  let score = 1000;
  const active = sessions.filter(s => s.status !== "cancelled");
  LECTURERS.forEach(lec => {
    for (let d = 0; d < 5; d++) {
      const hasDay = active.some(s => s.lecId === lec.id && s.day === d && s.mode === "day");
      const hasEve = active.some(s => s.lecId === lec.id && s.day === d && s.mode === "evening");
      if (hasDay && hasEve) score -= 50;
    }
  });
  GROUPS.forEach(grp => {
    for (let d = 0; d < 5; d++) {
      const daySlots = active
        .filter(s => s.groups.includes(grp.id) && s.day === d && s.mode === "day")
        .map(s => s.slot).sort((a, b) => a - b);
      for (let i = 1; i < daySlots.length; i++) {
        const gap = daySlots[i] - daySlots[i-1];
        if (gap > 1) score -= 20 * (gap - 1);
      }
    }
  });
  LECTURERS.forEach(lec => {
    const days = new Set(active.filter(s => s.lecId === lec.id).map(s => s.day));
    if (days.size > 3) score -= 15 * (days.size - 3);
  });
  active.filter(s => s.combined).forEach(s => {
    const room = ROOMS.find(r => r.id === s.roomId);
    const total = s.groups.reduce((sum, gid) => sum + (GROUPS.find(g => g.id === gid)?.count || 0), 0);
    if (room && room.cap < total * 1.1) score -= 30;
  });
  GROUPS.forEach(grp => {
    let streak = 0;
    for (let d = 0; d < 5; d++) {
      const hasEve = active.some(s => s.groups.includes(grp.id) && s.day === d && s.mode === "evening");
      streak = hasEve ? streak + 1 : 0;
      if (streak >= 3) score -= 25;
    }
  });
  return Math.max(0, score);
}

function annealStep(sessions, temperature) {
  const movable = sessions.filter(s => !s.locked && s.isGenerated);
  if (!movable.length) return { sessions, improved: false };
  const sess = movable[Math.floor(Math.random() * movable.length)];
  const pool = sess.mode === "evening" ? [0,1] : [0,1,2,3,4];
  const newDay = Math.floor(Math.random() * 5);
  const newSlot = pool[Math.floor(Math.random() * pool.length)];
  if (newDay === sess.day && newSlot === sess.slot) return { sessions, improved: false };

  // Validate availability of lecturer at new slot
  const avIdx = sess.mode === "evening" ? 5 : newSlot;
  const lec = LECTURERS.find(l => l.id === sess.lecId);
  if (!lec || lec.avail[newDay]?.[avIdx] !== 1) return { sessions, improved: false };

  const proposed = sessions.map(s => s.id === sess.id ? {...s, day: newDay, slot: newSlot} : s);
  const oldHard = detectConflicts(sessions).filter(c => c.severity === "hard").length;
  const newHard = detectConflicts(proposed).filter(c => c.severity === "hard").length;
  // Never accept moves that increase hard violations
  if (newHard > oldHard) return { sessions, improved: false };

  const delta = scoreSolution(proposed) - scoreSolution(sessions);
  if (delta >= 0 || Math.random() < Math.exp(delta / temperature)) {
    return { sessions: proposed, improved: delta > 0 };
  }
  return { sessions, improved: false };
}

async function runAlgorithm(lockedSessions, onProgress, cancelRef) {
  const log = [];
  const push = msg => { log.push(msg); };

  push("> Tri des séances par difficulté...");
  onProgress({ phase:"greedy", placed:0, failed:0, score:0, iteration:0, log:[...log] });
  await new Promise(r => setTimeout(r, 150));

  const { sessions: greedySessions, placed_count, failed } = greedyPlace(SCHEDULE_REQUESTS, lockedSessions);
  push(`> ${placed_count} séances nouvelles placées`);
  if (failed > 0) push(`> ⚠ ${failed} séances non placées`);
  push(`> Score initial: ${scoreSolution(greedySessions)}`);
  push(`> Démarrage de l'optimisation par recuit simulé...`);
  onProgress({ phase:"greedy", placed:placed_count, failed, score:scoreSolution(greedySessions), iteration:0, log:[...log] });
  await new Promise(r => setTimeout(r, 250));

  let current = greedySessions;
  let best = current;
  let bestScore = scoreSolution(current);
  let temp = 120;
  const ITER = 400;

  for (let i = 0; i < ITER; i++) {
    if (cancelRef.current) break;
    const { sessions: next, improved } = annealStep(current, temp);
    current = next;
    const sc = scoreSolution(current);
    if (sc > bestScore) { bestScore = sc; best = current; push(`> Itération ${i}: ↑ score ${sc}`); }
    temp *= 0.965;
    if (i % 40 === 0) {
      const newCount = current.filter(s=>s.isGenerated).length;
      onProgress({ phase:"annealing", placed:newCount, failed, score:bestScore, iteration:i, log:[...log] });
      await new Promise(r => setTimeout(r, 20));
    }
  }

  push(`> ✓ Terminé. Score final: ${bestScore}`);
  const hardLeft = detectConflicts(best).filter(c=>c.severity==="hard").length;
  push(`> Conflits critiques résiduels: ${hardLeft}`);
  const finalNewCount = best.filter(s=>s.isGenerated).length;
  onProgress({ phase:"done", placed:finalNewCount, failed, score:bestScore, iteration:ITER, log:[...log] });
  return best;
}

// ── GENERATION PANEL ─────────────────────────────────────────────────────────
function GenerationPanel({ lang, progress, onCancel, onAccept }) {
  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [progress.log?.length]);

  const phaseName = {
    greedy: lang==="fr"?"Phase 1 — Placement initial":"Phase 1 — Initial placement",
    annealing: lang==="fr"?"Phase 2 — Recuit simulé":"Phase 2 — Simulated annealing",
    done: lang==="fr"?"✓ Terminé":"✓ Complete",
  }[progress.phase] || "...";

  const iterPct = progress.phase==="annealing" ? Math.round((progress.iteration/400)*100)
    : progress.phase==="done" ? 100 : progress.phase==="greedy" ? 35 : 0;
  const scoreNorm = Math.min(100, Math.round((progress.score/1000)*100));

  return (
    <div className="gen-overlay">
      <div className="gen-panel">
        <div className="gen-title">{lang==="fr"?"Génération de l'emploi du temps":"Generating Timetable"}</div>
        <div className="gen-sub">{lang==="fr"?"Application des contraintes africaines — ISIMA Yaoundé":"Applying African university constraints — ISIMA Yaoundé"}</div>

        <div className={`gen-phase ${progress.phase}`}>
          {progress.phase!=="done"&&<div className="spin-sm"/>}
          {phaseName}
        </div>

        <div className="gen-metrics">
          <div className="gm-card">
            <div className="gm-val">{progress.placed}</div>
            <div className="gm-lbl">{lang==="fr"?"Séances placées":"Sessions placed"}</div>
          </div>
          <div className="gm-card">
            <div className="gm-val" style={{color:progress.failed>0?"var(--r400)":"var(--g400)"}}>{progress.failed}</div>
            <div className="gm-lbl">{lang==="fr"?"Non placées":"Unplaced"}</div>
          </div>
          <div className="gm-card">
            <div className="gm-val" style={{color:"var(--a400)"}}>{progress.score}</div>
            <div className="gm-lbl">{lang==="fr"?"Score qualité":"Quality score"}</div>
          </div>
        </div>

        <div className="gen-progress">
          <div className="gp-label">
            <span>{lang==="fr"?"Progression":"Progress"}</span>
            <span>{iterPct}%</span>
          </div>
          <div className="gp-bar">
            <div className={`gp-fill ${progress.phase==="annealing"?"annealing-fill":""}`} style={{width:`${iterPct}%`}}/>
          </div>
        </div>

        <div className="score-bar">
          <span className="score-label">{lang==="fr"?"Qualité":"Quality"}</span>
          <div className="score-track">
            <div className="score-fill" style={{width:`${scoreNorm}%`,background:scoreNorm>70?"var(--g500)":scoreNorm>40?"var(--a400)":"var(--r500)"}}/>
          </div>
          <span style={{fontSize:11,color:"var(--g400)",minWidth:36}}>{scoreNorm}%</span>
        </div>

        <div className="gen-log" ref={logRef}>
          {(progress.log||[]).map((line,i)=>(
            <div key={i} className={`gen-log-line ${i===(progress.log.length-1)?"new":""}`}>{line}</div>
          ))}
          {progress.phase!=="done"&&<div className="gen-log-line new">▋</div>}
        </div>

        <div className="gen-actions">
          {progress.phase!=="done"
            ?<button className="btn btn-danger btn-sm" onClick={onCancel}>{lang==="fr"?"Annuler":"Cancel"}</button>
            :<>
              <button className="btn btn-outline btn-sm" onClick={onCancel}>{lang==="fr"?"Ignorer":"Discard"}</button>
              <button className="btn btn-primary" onClick={onAccept}>{IC.check} {lang==="fr"?"Appliquer l'emploi du temps":"Apply timetable"}</button>
            </>
          }
        </div>
      </div>
    </div>
  );
}

              <button className="btn btn-primary" onClick={onAccept}>{IC.check} {lang==="fr"?"Appliquer l'emploi du temps":"Apply timetable"}</button>
            </>
          }
        </div>
      </div>
    </div>
  );
}

// ── PRINT TIMETABLE ───────────────────────────────────────────────────────────
function printTimetable(sessions, lang, inst, semester) {
  const days = lang==="fr" ? ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"] : ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const daySlots = ["07:00–09:00","09:00–11:00","11:00–13:00","14:00–16:00","16:00–18:00"];
  const eveSlots = ["18:00–20:00","20:00–22:00"];
  const active = sessions.filter(s => s.status !== "cancelled");
  const now = new Date().toLocaleDateString(lang==="fr"?"fr-FR":"en-GB",{day:"2-digit",month:"long",year:"numeric"});

  const cellHTML = (day, slot, mode) => {
    const sessList = active.filter(s => s.mode===mode && s.day===day && s.slot===slot);
    if (!sessList.length) return "";
    return sessList.map(s => {
      const course = COURSES.find(c=>c.id===s.courseId);
      const lec = LECTURERS.find(l=>l.id===s.lecId);
      const room = ROOMS.find(r=>r.id===s.roomId);
      const grpNames = s.groups.map(gid=>GROUPS.find(g=>g.id===gid)?.name.split("-")[0]).join(", ");
      const bg = s.combined ? "#fef3dc" : mode==="evening" ? "#f0f7fd" : "#dff3e7";
      const border = s.combined ? "#f0a824" : mode==="evening" ? "#2d7fc4" : "#5aba7d";
      return `<div style="background:${bg};border:1px solid ${border};border-radius:4px;padding:4px 6px;margin:2px 0;font-size:10px;">
        <div style="font-weight:700;color:#1a4228;">${course?.code||""}</div>
        <div style="color:#1a2130;">${lang==="fr"?course?.fr:course?.en}</div>
        <div style="color:#5c6878;">${room?.name} · ${lec?.name||""}</div>
        <div style="color:#7a8898;">${grpNames}</div>
      </div>`;
    }).join("");
  };

  const makeGrid = (mode) => {
    const slots = mode==="day" ? daySlots : eveSlots;
    const label = mode==="day" ? (lang==="fr"?"Emploi du temps — Journée (07h–17h)":"Timetable — Day programme (07h–17h)")
                                : (lang==="fr"?"Emploi du temps — Soirée (18h–22h)":"Timetable — Evening programme (18h–22h)");
    return `
      <h2 style="font-size:13px;font-weight:700;color:#1a4228;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.05em;">${label}</h2>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:10px;">
        <thead>
          <tr style="background:#1a4228;">
            <th style="color:white;padding:6px 8px;text-align:left;width:80px;">${lang==="fr"?"Créneau":"Slot"}</th>
            ${days.map(d=>`<th style="color:white;padding:6px 8px;text-align:left;">${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${slots.map((slotLabel,si)=>`
            <tr>
              <td style="padding:5px 8px;background:#f6f8fa;font-size:9px;font-weight:700;color:#7a8898;vertical-align:top;border:1px solid #edf1f5;">${slotLabel}</td>
              ${[0,1,2,3,4].map(di=>`<td style="padding:4px;vertical-align:top;border:1px solid #edf1f5;min-height:50px;">${cellHTML(di,si,mode)}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>`;
  };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${inst} — ${semester}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:20px;color:#1a2130}
      @media print{body{margin:10px}}
      h1{font-size:20px;font-weight:700;color:#0f2a1a;margin:0}
      .meta{font-size:11px;color:#7a8898;margin-top:4px}
      .divider{height:2px;background:#1a4228;margin:12px 0}
      .legend{display:flex;gap:16px;margin-top:10px;font-size:10px}
      .leg-item{display:flex;align-items:center;gap:5px}
      .leg-dot{width:10px;height:10px;border-radius:2px}
    </style>
  </head><body>
    <h1>${inst}</h1>
    <div class="meta">${semester} · ${lang==="fr"?"Généré le":"Generated on"} ${now}</div>
    <div class="divider"></div>
    <div class="legend">
      <div class="leg-item"><div class="leg-dot" style="background:#dff3e7;border:1px solid #5aba7d"></div>${lang==="fr"?"Journée":"Day"}</div>
      <div class="leg-item"><div class="leg-dot" style="background:#f0f7fd;border:1px solid #2d7fc4"></div>${lang==="fr"?"Soirée":"Evening"}</div>
      <div class="leg-item"><div class="leg-dot" style="background:#fef3dc;border:1px solid #f0a824"></div>${lang==="fr"?"Combinée":"Combined"}</div>
    </div>
    ${makeGrid("day")}
    ${makeGrid("evening")}
  </body></html>`;

  const win = window.open("","_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(()=>win.print(), 500);
  }
}

// ── STUDENT PORTAL PAGE ───────────────────────────────────────────────────────
function StudentPortalPage({ t, lang, sessions }) {
  const [selGroup, setSelGroup] = useState("");
  const [view, setView] = useState("week");
  const days = lang==="fr" ? ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"] : ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const daysShort = lang==="fr" ? ["Lun","Mar","Mer","Jeu","Ven"] : ["Mon","Tue","Wed","Thu","Fri"];
  const daySlots = ["07:00–09:00","09:00–11:00","11:00–13:00","14:00–16:00","16:00–18:00"];
  const eveSlots = ["18:00–20:00","20:00–22:00"];

  const grp = GROUPS.find(g => g.id === selGroup);
  const mySessions = selGroup
    ? sessions.filter(s => s.groups.includes(selGroup) && s.status !== "cancelled")
    : [];

  const getAt = (day, slot, mode) => mySessions.filter(s => s.day===day && s.slot===slot && s.mode===mode);

  const renderCard = (sess) => {
    const course = COURSES.find(c=>c.id===sess.courseId);
    const lec = LECTURERS.find(l=>l.id===sess.lecId);
    const room = ROOMS.find(r=>r.id===sess.roomId);
    return (
      <div key={sess.id} style={{
        background: sess.combined?"var(--a50)":sess.mode==="evening"?"var(--b50)":"var(--g50)",
        border: `1px solid ${sess.combined?"var(--a200)":sess.mode==="evening"?"var(--b100)":"var(--g200)"}`,
        borderRadius:"var(--r8)", padding:"5px 8px", margin:"2px 0", fontSize:11,
      }}>
        <div style={{fontWeight:700,color:sess.mode==="evening"?"var(--b600)":"var(--g800)"}}>{lang==="fr"?course?.fr:course?.en}</div>
        <div style={{color:"var(--n600)",marginTop:1}}>{room?.name} · {lec?.name}</div>
        {sess.combined && <span className="badge b-a" style={{marginTop:3,fontSize:8}}>COMB</span>}
        {sess.isMakeup && <span className="badge b-a" style={{marginTop:3,fontSize:8}}>RAT</span>}
      </div>
    );
  };

  return (
    <div>
      {/* Hero */}
      <div className="portal-hero">
        <div className="portal-title">{t.portalTitle}</div>
        <div className="portal-sub">{t.portalSub}</div>
        <div className="portal-select">
          <select value={selGroup} onChange={e=>setSelGroup(e.target.value)}>
            <option value="">{t.selectGroup}...</option>
            {GROUPS.map(g=>(
              <option key={g.id} value={g.id}>{g.name} — {g.prog} (L{g.level}, {g.mode==="day"?t.day:t.evening})</option>
            ))}
          </select>
        </div>
      </div>

      {!selGroup ? (
        <div className="card">
          <div className="card-body">
            <div className="empty">{IC.portal}<p>{t.portalSub}</p></div>
          </div>
        </div>
      ) : (
        <>
          {/* Group info bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:"var(--g800)",color:"var(--white)",borderRadius:"var(--r8)",padding:"6px 12px",fontWeight:700,fontSize:13}}>{grp?.name}</div>
              <span className="badge b-g">{mySessions.length} {lang==="fr"?"séances":"sessions"}</span>
              <span className={`chip ${grp?.mode==="day"?"chip-d":"chip-e"}`}>{grp?.mode==="day"?t.day:t.evening}</span>
            </div>
            <div className="view-toggle no-print">
              <button className={`view-btn ${view==="week"?"on":""}`} onClick={()=>setView("week")}>{t.weeklyView}</button>
              <button className={`view-btn ${view==="list"?"on":""}`} onClick={()=>setView("list")}>{t.listView}</button>
            </div>
          </div>

          {mySessions.length === 0 ? (
            <div className="card"><div className="card-body"><div className="empty">{IC.calendar}<p>{t.noSessions}</p></div></div></div>
          ) : view==="week" ? (
            // WEEK VIEW
            <div className="tt-wrap">
              <div className="tt-scroll">
                <table className="tt-table">
                  <thead><tr>
                    <th>{lang==="fr"?"Créneau":"Slot"}</th>
                    {days.map(d=><th key={d}>{d}</th>)}
                  </tr></thead>
                  <tbody>
                    {/* Day rows */}
                    {daySlots.map((slotLabel,si)=>(
                      <tr key={`d${si}`}>
                        <td>{slotLabel.split("–")[0]}<br/><span style={{opacity:.6}}>–{slotLabel.split("–")[1]}</span></td>
                        {[0,1,2,3,4].map(di=>(
                          <td key={di}>{getAt(di,si,"day").map(renderCard)}</td>
                        ))}
                      </tr>
                    ))}
                    {/* Evening rows */}
                    {eveSlots.map((slotLabel,si)=>(
                      <tr key={`e${si}`}>
                        <td style={{background:"rgba(45,127,196,.04)"}}>{slotLabel.split("–")[0]}<br/><span style={{opacity:.6}}>–{slotLabel.split("–")[1]}</span></td>
                        {[0,1,2,3,4].map(di=>(
                          <td key={di} style={{background:"rgba(45,127,196,.03)"}}>{getAt(di,si,"evening").map(renderCard)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // LIST VIEW — sorted by day then slot
            <div>
              {[...mySessions]
                .sort((a,b) => a.day!==b.day ? a.day-b.day : a.slot-b.slot)
                .map(sess => {
                  const course = COURSES.find(c=>c.id===sess.courseId);
                  const lec = LECTURERS.find(l=>l.id===sess.lecId);
                  const room = ROOMS.find(r=>r.id===sess.roomId);
                  const slots = sess.mode==="day" ? daySlots : eveSlots;
                  return (
                    <div key={sess.id} className="list-sess">
                      <div className="list-day-badge">
                        <div className="ldb-day">{daysShort[sess.day]}</div>
                        <div className="ldb-slot">{slots[sess.slot]?.split("–")[0]}<br/>–{slots[sess.slot]?.split("–")[1]}</div>
                      </div>
                      <div style={{flex:1}}>
                        <div className="list-sess-course">{lang==="fr"?course?.fr:course?.en}</div>
                        <div className="list-sess-meta">{course?.code} · {room?.name} · {lec?.full}</div>
                        <div className="list-sess-tags">
                          {sess.combined&&<span className="badge b-a">{t.combined}</span>}
                          {sess.isMakeup&&<span className="badge b-a">{lang==="fr"?"Rattrapage":"Make-up"}</span>}
                          <span className={`badge ${sess.mode==="day"?"b-g":"b-b"}`}>{sess.mode==="day"?t.day:t.evening}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Print hint */}
          <div style={{marginTop:14,padding:"10px 14px",background:"var(--n50)",borderRadius:"var(--r8)",fontSize:11,color:"var(--n500)",display:"flex",gap:8,alignItems:"center"}} className="no-print">
            {IC.print}{t.printHint}
          </div>
        </>
      )}
    </div>
  );
}

// ── EXAM MODULE ───────────────────────────────────────────────────────────────
const EXAM_SLOTS = ["08:00","09:30","11:00","12:30","14:00","15:30","17:00"];
const EXAM_DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven"];
const EXAM_DAYS_EN = ["Mon","Tue","Wed","Thu","Fri"];
const EXAM_DAYS_FULL_FR = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
const EXAM_DAYS_FULL_EN = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Exam conflict detection — different rules from regular timetable
function detectExamConflicts(exams) {
  const issues = [];
  for (let i = 0; i < exams.length; i++) {
    for (let j = i + 1; j < exams.length; j++) {
      const a = exams[i], b = exams[j];
      if (a.day !== b.day || a.slot !== b.slot) continue;
      // Same group has two exams at same slot
      const shared = a.groups.filter(g => b.groups.includes(g));
      if (shared.length) {
        const gnames = shared.map(gid => GROUPS.find(g => g.id === gid)?.name).join(", ");
        issues.push({ id:`eg${i}${j}`, type:"EXAM_SAME_SLOT", severity:"hard",
          examIds:[a.id,b.id],
          msg_fr:`${gnames} a deux examens simultanés`,
          msg_en:`${gnames} has two exams at the same time` });
      }
      // Same room double-booked
      if (a.roomId === b.roomId) {
        const r = ROOMS.find(r => r.id === a.roomId);
        issues.push({ id:`er${i}${j}`, type:"EXAM_ROOM_BUSY", severity:"hard",
          examIds:[a.id,b.id],
          msg_fr:`${r?.name} est réservée deux fois au même créneau`,
          msg_en:`${r?.name} is double-booked` });
      }
      // Same invigilator
      if (a.invigilatorId && a.invigilatorId === b.invigilatorId) {
        const l = LECTURERS.find(l => l.id === a.invigilatorId);
        issues.push({ id:`ei${i}${j}`, type:"EXAM_INVIG_BUSY", severity:"hard",
          examIds:[a.id,b.id],
          msg_fr:`${l?.name} surveille deux examens simultanément`,
          msg_en:`${l?.name} is invigilating two exams simultaneously` });
      }
    }
    // Same group — two exams same day (soft warning)
    const a = exams[i];
    const sameDay = exams.filter((b,j) => j!==i && b.day===a.day &&
      b.groups.some(g => a.groups.includes(g)));
    if (sameDay.length > 0) {
      const alreadyFlagged = issues.find(c => c.type==="EXAM_SAME_DAY" && c.examIds.includes(a.id));
      if (!alreadyFlagged) {
        const gname = GROUPS.find(g => a.groups.includes(g.id) && sameDay[0].groups.includes(g.id))?.name || "";
        issues.push({ id:`esd${i}`, type:"EXAM_SAME_DAY", severity:"soft",
          examIds:[a.id, sameDay[0].id],
          msg_fr:`${gname} a deux examens le même jour`,
          msg_en:`${gname} has two exams on the same day` });
      }
    }
    // Capacity check
    const room = ROOMS.find(r => r.id === a.roomId);
    const total = a.groups.reduce((sum,gid) => sum+(GROUPS.find(g=>g.id===gid)?.count||0),0);
    if (room && total > room.cap) {
      issues.push({ id:`ec${i}`, type:"EXAM_CAPACITY", severity:"hard",
        examIds:[a.id],
        msg_fr:`${room.name} (cap.${room.cap}) insuffisant pour ${total} étudiants`,
        msg_en:`${room.name} (cap.${room.cap}) too small for ${total} students` });
    }
  }
  return issues.filter((c,i,arr) => arr.findIndex(x=>x.id===c.id)===i);
}

// Auto-schedule: place each exam in first valid slot
function autoScheduleExams(courses, existingExams) {
  const placed = [...existingExams];
  const newExams = [];
  // Shuffle courses for variety
  const shuffled = [...courses].sort(() => Math.random() - 0.5);
  for (const course of shuffled) {
    // Find groups that study this course
    const groupIds = GROUPS.map(g=>g.id); // simplified: assign all groups
    const total = groupIds.reduce((s,gid)=>s+(GROUPS.find(g=>g.id===gid)?.count||0),0);
    const room = ROOMS.filter(r=>r.cap>=total).sort((a,b)=>a.cap-b.cap)[0];
    if (!room) continue;
    const invig = LECTURERS[Math.floor(Math.random()*LECTURERS.length)];
    let placed_flag = false;
    for (let day=0; day<5 && !placed_flag; day++) {
      for (let slot=0; slot<EXAM_SLOTS.length && !placed_flag; slot++) {
        const allExams = [...placed, ...newExams];
        const roomBusy = allExams.some(e=>e.day===day&&e.slot===slot&&e.roomId===room.id);
        const invigBusy = allExams.some(e=>e.day===day&&e.slot===slot&&e.invigilatorId===invig.id);
        if (!roomBusy && !invigBusy) {
          newExams.push({
            id:`exam-${course.id}-${day}-${slot}`,
            courseId:course.id, roomId:room.id, invigilatorId:invig.id,
            groups:groupIds.slice(0,2), day, slot, duration:120,
            type:"written", isGenerated:true,
          });
          placed_flag = true;
        }
      }
    }
  }
  return newExams;
}

// ── EXAM FORM ─────────────────────────────────────────────────────────────────
function ExamForm({ lang, exam, exams, onSave, onClose, onDelete }) {
  const t = T[lang];
  const isEdit = !!exam?.id;
  const [form, setForm] = useState({
    courseId: exam?.courseId || "",
    roomId: exam?.roomId || "",
    invigilatorId: exam?.invigilatorId || "",
    groups: exam?.groups || [],
    day: exam?.day ?? 0,
    slot: exam?.slot ?? 0,
    duration: exam?.duration ?? 120,
    type: exam?.type || "written",
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleGroup = gid => setForm(p=>({...p,groups:p.groups.includes(gid)?p.groups.filter(x=>x!==gid):[...p.groups,gid]}));

  const totalStudents = form.groups.reduce((s,gid)=>s+(GROUPS.find(g=>g.id===gid)?.count||0),0);
  const selRoom = ROOMS.find(r=>r.id===form.roomId);

  // Live conflict check for this exam
  const proposal = form.courseId && form.roomId && form.groups.length ? {
    id: exam?.id || "__new__",
    courseId:form.courseId, roomId:form.roomId, invigilatorId:form.invigilatorId,
    groups:form.groups, day:Number(form.day), slot:Number(form.slot),
    duration:Number(form.duration), type:form.type,
  } : null;
  const cfls = useMemo(() => {
    if (!proposal) return [];
    const all = [...exams.filter(e=>e.id!==exam?.id), proposal];
    return detectExamConflicts(all).filter(c=>c.examIds.includes(proposal.id));
  }, [form, exams]);
  const canSave = proposal && cfls.filter(c=>c.severity==="hard").length===0;

  const days = lang==="fr" ? EXAM_DAYS_FULL_FR : EXAM_DAYS_FULL_EN;

  if (confirmDel) return (
    <div style={{textAlign:"center",padding:"10px 0"}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{lang==="fr"?"Supprimer cet examen ?":"Delete this exam?"}</div>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        <button className="btn btn-danger" onClick={()=>{onDelete(exam.id);onClose();}}>{t.yes}</button>
        <button className="btn btn-outline" onClick={()=>setConfirmDel(false)}>{t.cancel}</button>
      </div>
    </div>
  );

  return (
    <>
      {/* Course + Type row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}} className="fg">
        <div>
          <label className="fl">{t.course} <span className="req">*</span></label>
          <select className="fs" value={form.courseId} onChange={e=>set("courseId",e.target.value)}>
            <option value="">{lang==="fr"?"Sélectionner...":"Select..."}</option>
            {COURSES.map(c=><option key={c.id} value={c.id}>{c.code} — {lang==="fr"?c.fr:c.en}</option>)}
          </select>
        </div>
        <div>
          <label className="fl">{t.examType}</label>
          <select className="fs" value={form.type} onChange={e=>set("type",e.target.value)}>
            <option value="written">{t.written}</option>
            <option value="oral">{t.oral}</option>
            <option value="practical">{t.practical}</option>
          </select>
        </div>
      </div>
      {/* Day + Slot + Duration */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}} className="fg">
        <div>
          <label className="fl">{t.examDate}</label>
          <select className="fs" value={form.day} onChange={e=>set("day",Number(e.target.value))}>
            {days.map((d,i)=><option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="fl">{t.examStart}</label>
          <select className="fs" value={form.slot} onChange={e=>set("slot",Number(e.target.value))}>
            {EXAM_SLOTS.map((s,i)=><option key={i} value={i}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="fl">{t.examDuration}</label>
          <select className="fs" value={form.duration} onChange={e=>set("duration",Number(e.target.value))}>
            {[60,90,120,150,180].map(d=><option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>
      {/* Room */}
      <div className="fg">
        <label className="fl">
          {t.examRoom} <span className="req">*</span>
          {selRoom&&<span style={{fontSize:10,color:"var(--n500)",fontWeight:400,marginLeft:4}}>
            cap.{selRoom.cap}{totalStudents>0&&` · ${totalStudents} ${t.students}`}
            {totalStudents>selRoom.cap&&<span style={{color:"var(--r600)",fontWeight:700}}> ⚠</span>}
          </span>}
        </label>
        <select className="fs" value={form.roomId} onChange={e=>set("roomId",e.target.value)}>
          <option value="">{lang==="fr"?"Sélectionner...":"Select..."}</option>
          {ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} ({r.cap} {lang==="fr"?"pl.":"seats"})</option>)}
        </select>
      </div>
      {/* Invigilator */}
      <div className="fg">
        <label className="fl">{t.examInvigilator}</label>
        <select className="fs" value={form.invigilatorId} onChange={e=>set("invigilatorId",e.target.value)}>
          <option value="">{lang==="fr"?"Sélectionner...":"Select..."}</option>
          {LECTURERS.map(l=><option key={l.id} value={l.id}>{l.full}</option>)}
        </select>
      </div>
      {/* Groups */}
      <div className="fg">
        <label className="fl">{t.examGroups} <span className="req">*</span></label>
        <div className="group-picker">
          {GROUPS.map(g=>(
            <div key={g.id} className={`gp-item ${form.groups.includes(g.id)?"sel":""}`} onClick={()=>toggleGroup(g.id)}>
              <div className={`gp-chk ${form.groups.includes(g.id)?"on":""}`}>{form.groups.includes(g.id)&&IC.check}</div>
              <div className="gp-name">{g.name}</div>
              <div className="gp-cnt">{g.count} {t.students}</div>
            </div>
          ))}
        </div>
        {form.groups.length>0&&<div style={{fontSize:11,color:"var(--n600)",marginTop:4}}>
          Total: <strong>{totalStudents}</strong> {t.students}
        </div>}
      </div>
      {/* Conflict preview */}
      {proposal&&(
        <div className={`cf-preview ${cfls.length===0?"cf-ok":"cf-err"}`}>
          <div className="cf-title" style={{color:cfls.length===0?"var(--g700)":"var(--r600)"}}>
            {cfls.length===0?`✓ ${t.noConflict}`:`⚠ ${t.conflictsFound} (${cfls.length})`}
          </div>
          {cfls.map((c,i)=>(
            <div key={i} className="cf-item" style={{color:"var(--r600)"}}>
              <span>•</span><span>{lang==="fr"?c.msg_fr:c.msg_en}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mfoot" style={{padding:"14px 0 0",marginTop:6}}>
        {isEdit&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(true)}>{IC.trash} {t.delete}</button>}
        <div style={{flex:1}}/>
        <button className="btn btn-outline" onClick={onClose}>{t.cancel}</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={()=>{
          onSave({
            id: exam?.id || `exam-${Date.now()}`,
            courseId:form.courseId, roomId:form.roomId,
            invigilatorId:form.invigilatorId||null,
            groups:form.groups, day:Number(form.day), slot:Number(form.slot),
            duration:Number(form.duration), type:form.type,
          });
          onClose();
        }}>{IC.check} {t.save}</button>
      </div>
    </>
  );
}

// ── EXAMS PAGE ────────────────────────────────────────────────────────────────
function ExamsPage({ t, lang, exams, setExams, setModal, showToast }) {
  const [view, setView] = useState("list");
  const conflicts = useMemo(() => detectExamConflicts(exams), [exams]);
  const hardCount = conflicts.filter(c=>c.severity==="hard").length;
  const conflictExamIds = new Set(conflicts.filter(c=>c.severity==="hard").flatMap(c=>c.examIds));
  const days = lang==="fr" ? EXAM_DAYS_FR : EXAM_DAYS_EN;
  const daysFull = lang==="fr" ? EXAM_DAYS_FULL_FR : EXAM_DAYS_FULL_EN;

  const handleAutoSchedule = () => {
    const generated = autoScheduleExams(COURSES, exams);
    setExams(prev => [...prev.filter(e=>!e.isGenerated), ...generated]);
    showToast(lang==="fr"?`${generated.length} examens planifiés automatiquement`:`${generated.length} exams auto-scheduled`,"ok");
  };

  const typeColors = { written:"type-written", oral:"type-oral", practical:"type-practical" };
  const typeLabel = (tp) => ({ written:t.written, oral:t.oral, practical:t.practical })[tp] || tp;

  return (
    <div>
      <div className="sh">
        <div>
          <div className="sh-title">{t.examModule}</div>
          <div className="sh-sub">{t.examSub}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-outline no-print" onClick={handleAutoSchedule}>
            {IC.bolt} {t.generateExams}
          </button>
          <button className="btn btn-primary" onClick={()=>setModal({type:"addExam"})}>
            {IC.plus} {t.addExam}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {val:exams.length,lbl:lang==="fr"?"Examens planifiés":"Exams scheduled",color:"var(--p600)"},
          {val:exams.filter(e=>e.type==="written").length,lbl:lang==="fr"?"Écrits":"Written",color:"var(--p600)"},
          {val:exams.filter(e=>e.type==="oral").length,lbl:lang==="fr"?"Oraux":"Oral",color:"var(--b600)"},
          {val:hardCount,lbl:lang==="fr"?"Conflits":"Conflicts",color:hardCount>0?"var(--r500)":"var(--g600)"},
        ].map((s,i)=>(
          <div key={i} className="exam-stat">
            <div className="exam-stat-val" style={{color:s.color}}>{s.val}</div>
            <div className="exam-stat-lbl" style={{color:s.color}}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Conflict alerts */}
      {conflicts.length>0&&(
        <div style={{marginBottom:16}}>
          {conflicts.filter(c=>c.severity==="hard").slice(0,3).map((c,i)=>(
            <div key={i} className="alert alert-r" style={{marginBottom:6}}>
              {IC.alert}<span>{lang==="fr"?c.msg_fr:c.msg_en}</span>
            </div>
          ))}
          {conflicts.filter(c=>c.severity==="soft").slice(0,2).map((c,i)=>(
            <div key={i} className="alert alert-a" style={{marginBottom:6}}>
              {IC.alert}<span>{lang==="fr"?c.msg_fr:c.msg_en}</span>
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button className={`view-btn ${view==="list"?"on":""}`} onClick={()=>setView("list")}>{t.listView}</button>
        <button className={`view-btn ${view==="grid"?"on":""}`} onClick={()=>setView("grid")}>{t.weeklyView}</button>
      </div>

      {exams.length===0 ? (
        <div className="card"><div className="card-body">
          <div className="empty">{IC.exam}<p>{t.noExams}</p></div>
        </div></div>
      ) : view==="list" ? (
        // LIST VIEW
        <div>
          {[...exams].sort((a,b)=>a.day!==b.day?a.day-b.day:a.slot-b.slot).map(exam=>{
            const course = COURSES.find(c=>c.id===exam.courseId);
            const room = ROOMS.find(r=>r.id===exam.roomId);
            const invig = LECTURERS.find(l=>l.id===exam.invigilatorId);
            const grps = exam.groups.map(gid=>GROUPS.find(g=>g.id===gid));
            const total = grps.reduce((s,g)=>s+(g?.count||0),0);
            const hasConflict = conflictExamIds.has(exam.id);
            const d = new Date(2025, 11, 15 + exam.day); // week of Dec 15 2025
            return (
              <div key={exam.id} className={`exam-card ${hasConflict?"has-conflict":""}`}
                onClick={()=>setModal({type:"editExam",exam})}>
                <div className="exam-date-badge">
                  <div className="edb-day">{d.getDate()}</div>
                  <div className="edb-month">{(lang==="fr"?MONTHS_FR:MONTHS_EN)[d.getMonth()]}</div>
                </div>
                <div className="exam-info">
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <div className="exam-course">{lang==="fr"?course?.fr:course?.en}</div>
                    <span className={`exam-type-badge ${typeColors[exam.type]||""}`}>{typeLabel(exam.type)}</span>
                    {hasConflict&&<span className="badge b-r">⚠</span>}
                  </div>
                  <div className="exam-meta">
                    <span>📅 {daysFull[exam.day]}</span>
                    <span>⏰ {EXAM_SLOTS[exam.slot]} ({exam.duration}min)</span>
                    <span>🏛 {room?.name||"—"}</span>
                    {invig&&<span>👤 {invig.name}</span>}
                  </div>
                  <div className="exam-groups">
                    {grps.map(g=>g&&<span key={g.id} className="gp">{g.name.split("-")[0]}</span>)}
                    <span style={{fontSize:10,color:"var(--n500)",marginLeft:4}}>{total} {t.students}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // GRID VIEW
        <div className="tt-wrap">
          <div className="tt-scroll">
            <div className="exam-grid" style={{gridTemplateColumns:`80px repeat(5,1fr)`,minWidth:600}}>
              <div className="eg-header"/>
              {days.map(d=><div key={d} className="eg-header">{d}</div>)}
              {EXAM_SLOTS.map((slotTime,si)=>(
                <>
                  <div key={`s${si}`} className="eg-slot">{slotTime}</div>
                  {[0,1,2,3,4].map(di=>{
                    const cell = exams.filter(e=>e.day===di&&e.slot===si);
                    return (
                      <div key={di} className={`eg-cell ${cell.length?"has-exam":""}`}>
                        {cell.map(exam=>{
                          const course=COURSES.find(c=>c.id===exam.courseId);
                          const room=ROOMS.find(r=>r.id===exam.roomId);
                          return (
                            <div key={exam.id} className="ex-chip"
                              onClick={()=>setModal({type:"editExam",exam})}>
                              <div className="ec-code">{course?.code}</div>
                              <div className="ec-name">{lang==="fr"?course?.fr:course?.en}</div>
                              <div className="ec-meta">{room?.name} · {exam.duration}min</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [lang,setLang]=useState("fr");
  const [page,setPage]=useState("dashboard");
  const [mode,setMode]=useState("day");
  const [sessions,setSessions]=useState(INIT_SESSIONS);
  const [modal,setModal]=useState(null);
  const [toast,setToast]=useState(null);
  const [generating,setGenerating]=useState(false);
  const [generated,setGenerated]=useState(false);
  const [logs,setLogs]=useState([]);
  const [genProgress,setGenProgress]=useState(null);
  const [pendingSessions,setPendingSessions]=useState(null);
  const cancelRef=useRef(false);
  const [exams,setExams]=useState([]);

  const t=T[lang];
  const conflicts=useMemo(()=>detectConflicts(sessions),[sessions]);
  const hardCount=conflicts.filter(c=>c.severity==="hard").length;

  const showToast=(msg,type="ok")=>{
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  const saveSession=(sess)=>{
    setSessions(prev=>{
      const exists=prev.find(s=>s.id===sess.id);
      return exists?prev.map(s=>s.id===sess.id?sess:s):[...prev,sess];
    });
    showToast(t.savedOk,"ok");
  };
  const deleteSession=(id)=>{
    setSessions(prev=>prev.filter(s=>s.id!==id));
    showToast(t.deletedOk,"warn");
  };
  const toggleLock=(id)=>setSessions(prev=>prev.map(s=>s.id===id?{...s,locked:!s.locked}:s));

  const addLog=(type,msg,detail)=>{
    const now=new Date();
    const time=`${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    setLogs(prev=>[...prev,{type,msg,detail,time}]);
  };

  const handleCancelSubstitute=({session,reason,subLecId,makeupSlot})=>{
    const tl=T[lang];
    const course=COURSES.find(c=>c.id===session.courseId);
    const sub=LECTURERS.find(l=>l.id===subLecId);
    const courseName=lang==="fr"?course?.fr:course?.en;
    const newEntries=[];

    // 1. Mark original session as cancelled
    setSessions(prev=>{
      const updated = prev.map(s=>s.id===session.id
        ?{...s,status:"cancelled",cancelReason:reason,substituteId:subLecId||null}
        :s
      );

      // 2. Build substitute session if selected
      if(subLecId){
        newEntries.push({
          id:`sub-${Date.now()}`,courseId:session.courseId,lecId:subLecId,
          roomId:session.roomId,day:session.day,slot:session.slot,
          groups:session.groups,combined:session.combined,mode:session.mode,
          locked:false,isSubstitute:true,originalLecId:session.lecId,
        });
      }

      // 3. Build makeup session if slot selected
      if(makeupSlot!==null&&makeupSlot!==undefined){
        const slots=findMakeupSlots(session,updated,lang);
        const ms=slots[makeupSlot];
        if(ms){
          newEntries.push({
            id:`makeup-${Date.now()+1}`,courseId:session.courseId,
            lecId:subLecId||session.lecId,roomId:session.roomId,
            day:ms.day,slot:ms.slot,
            groups:session.groups,combined:session.combined,
            mode:ms.isSat?"day":session.mode,locked:false,isMakeup:true,
          });
        }
      }
      return [...updated,...newEntries];
    });

    // 4. Log everything
    addLog("cancelled",`${tl.cancelledBadge}: ${courseName}`,`${reason}${sub?` → ${sub.name}`:""}`);
    showToast(tl.cancelOk,"warn");
    if(subLecId){
      addLog("substituted",`${tl.subBadge}: ${sub?.name} → ${courseName}`,lang==="fr"?DAYS_FR[session.day]:DAYS_EN[session.day]);
      showToast(tl.subOk,"ok");
    }
    if(makeupSlot!==null&&makeupSlot!==undefined){
      addLog("makeup",`${tl.makeupBadge}: ${courseName}`,lang==="fr"?"Créneau planifié":"Slot scheduled");
      showToast(tl.makeupOk,"ok");
    }
  };

  const handleGenerate = async () => {
    cancelRef.current = false;
    const locked = sessions.filter(s => s.locked);
    const initial = { phase:"greedy", placed:0, failed:0, score:0, iteration:0, log:[] };
    setGenProgress(initial);
    const result = await runAlgorithm(
      locked,
      (prog) => setGenProgress(prev => typeof prog==="function" ? prog(prev) : {...prev,...prog}),
      cancelRef
    );
    if (!cancelRef.current) setPendingSessions(result);
  };

  const handleAcceptGenerated = () => {
    if (pendingSessions) {
      // Keep only: manually added sessions that are locked OR not generated
      // Replace all previous generated sessions with the new batch
      setSessions(prev => {
        const manualLocked = prev.filter(s => s.locked && !s.isGenerated);
        const newGenerated = pendingSessions.filter(s => s.isGenerated);
        const manualUnlocked = prev.filter(s => !s.locked && !s.isGenerated && s.status !== "cancelled");
        return [...manualLocked, ...manualUnlocked, ...newGenerated];
      });
      setGenerated(true);
      setPage("timetable");
      addLog("created",
        lang==="fr"?"Emploi du temps généré automatiquement":"Timetable auto-generated",
        `${pendingSessions.filter(s=>s.isGenerated).length} ${lang==="fr"?"nouvelles séances":"new sessions"}`
      );
      showToast(lang==="fr"?"Emploi du temps appliqué":"Timetable applied","ok");
    }
    setGenProgress(null);
    setPendingSessions(null);
  };

  const handleCancelGenerate = () => {
    cancelRef.current = true;
    setGenerating(false);
    setGenProgress(null);
    setPendingSessions(null);
  };

  const examConflicts = useMemo(()=>detectExamConflicts(exams),[exams]);
  const examHardCount = examConflicts.filter(c=>c.severity==="hard").length;

  const navItems=[
    {id:"dashboard",icon:IC.dashboard,label:t.dashboard},
    {id:"timetable",icon:IC.calendar,label:t.timetable},
    {id:"groups",icon:IC.group,label:t.groups},
    {id:"lecturers",icon:IC.users,label:t.lecturers},
    {id:"rooms",icon:IC.room,label:t.rooms},
    {id:"conflicts",icon:IC.alert,label:t.conflicts,badge:hardCount>0?hardCount:null},
    {id:"exams",icon:IC.exam,label:t.exams,badge:examHardCount>0?examHardCount:null},
    {id:"gestion",icon:IC.log,label:t.gestion,badge:logs.filter(l=>l.type==="cancelled").length>0?logs.filter(l=>l.type==="cancelled").length:null},
    {id:"portal",icon:IC.portal,label:t.studentPortal},
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-logo">
            <h1>UniSchedule</h1>
            <span>Africa</span>
          </div>
          <nav className="sb-nav">
            <div className="sb-sec">{lang==="fr"?"Navigation":"Navigation"}</div>
            {navItems.map(item=>(
              <div key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>setPage(item.id)}>
                {item.icon}{item.label}
                {item.badge&&<span className="nb">{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="sb-info">{t.inst}<br/>{t.semester}</div>
            <div className="lang-row">
              <button className={`lbtn ${lang==="fr"?"on":""}`} onClick={()=>setLang("fr")}>FR</button>
              <button className={`lbtn ${lang==="en"?"on":""}`} onClick={()=>setLang("en")}>EN</button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <header className="topbar">
            <div className="tb-title">{t[page]||t.dashboard}</div>
            <div className="tb-right">
              {hardCount>0&&<span className="badge b-r" style={{cursor:"pointer"}} onClick={()=>setPage("conflicts")}>{hardCount} {lang==="fr"?"conflit(s)":"conflict(s)"}</span>}
              {page==="timetable"&&(
                <button className="btn btn-outline no-print" onClick={()=>printTimetable(sessions,lang,t.inst,t.semester)}>
                  {IC.print} {t.exportPdf}
                </button>
              )}
              <button className="btn btn-amber" onClick={handleGenerate} disabled={!!genProgress}>
                {IC.bolt} {genProgress?t.generating:t.generate}
              </button>
            </div>
          </header>

          <div className="content">
            {page==="dashboard"&&<DashboardPage t={t} lang={lang} sessions={sessions} conflicts={conflicts} hardCount={hardCount} setPage={setPage} generated={generated}/>}
            {page==="timetable"&&<TimetablePage t={t} lang={lang} sessions={sessions} setSessions={setSessions} conflicts={conflicts} mode={mode} setMode={setMode} setModal={setModal} showToast={showToast}/>}
            {page==="groups"&&<GroupsPage t={t} lang={lang} sessions={sessions}/>}
            {page==="lecturers"&&<LecturersPage t={t} lang={lang} sessions={sessions}/>}
            {page==="rooms"&&<RoomsPage t={t} lang={lang} sessions={sessions}/>}
            {page==="conflicts"&&<ConflictsPage t={t} lang={lang} conflicts={conflicts} sessions={sessions}/>}
            {page==="exams"&&<ExamsPage t={t} lang={lang} exams={exams} setExams={setExams} setModal={setModal} showToast={showToast}/>}
            {page==="gestion"&&<GestionPage t={t} lang={lang} logs={logs} sessions={sessions}/>}
            {page==="portal"&&<StudentPortalPage t={t} lang={lang} sessions={sessions}/>}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal&&(
        <div className="backdrop" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="mhdr">
              <div className="mtitle">
                {modal.type==="add"?t.addSession
                  :modal.type==="edit"?t.editSession
                  :modal.type==="cancel"?(lang==="fr"?"Annuler la séance":"Cancel Session")
                  :modal.type==="addExam"?t.addExam
                  :modal.type==="editExam"?t.editExam
                  :(lang==="fr"?"Détail de la séance":"Session detail")}
              </div>
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>{IC.x}</button>
            </div>
            <div className="mbody">
              {(modal.type==="add"||modal.type==="edit")&&(
                <SessionForm lang={lang} sessions={sessions}
                  initial={modal.type==="edit"?modal.session:{day:modal.day,slot:modal.slot,mode:modal.mode||mode}}
                  onSave={saveSession} onDelete={deleteSession} onClose={()=>setModal(null)}/>
              )}
              {modal.type==="detail"&&(
                <SessionDetail session={modal.session} lang={lang} conflicts={conflicts}
                  onEdit={()=>setModal({type:"edit",session:modal.session})}
                  onClose={()=>setModal(null)}
                  onToggleLock={(id)=>{toggleLock(id);setModal(null);}}
                  onCancel={(sess)=>setModal({type:"cancel",session:sess})}/>
              )}
              {modal.type==="cancel"&&(
                <CancelSubstituteModal
                  session={modal.session} sessions={sessions} lang={lang}
                  onClose={()=>setModal(null)}
                  onConfirm={handleCancelSubstitute}/>
              )}
              {(modal.type==="addExam"||modal.type==="editExam")&&(
                <ExamForm
                  lang={lang}
                  exam={modal.type==="editExam"?modal.exam:null}
                  exams={exams}
                  onSave={(exam)=>{
                    setExams(prev=>{
                      const exists=prev.find(e=>e.id===exam.id);
                      return exists?prev.map(e=>e.id===exam.id?exam:e):[...prev,exam];
                    });
                    showToast(t.examOk,"ok");
                  }}
                  onDelete={(id)=>{
                    setExams(prev=>prev.filter(e=>e.id!==id));
                    showToast(t.examDeleted,"warn");
                  }}
                  onClose={()=>setModal(null)}/>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GENERATION PANEL */}
      {genProgress&&(
        <GenerationPanel
          lang={lang}
          progress={genProgress}
          onCancel={handleCancelGenerate}
          onAccept={handleAcceptGenerated}
        />
      )}

      {/* TOAST */}
      {toast&&(
        <div className={`toast ${toast.type}`}>
          {toast.type==="ok"?IC.check:IC.alert}
          {toast.msg}
        </div>
      )}
    </>
  );
}
