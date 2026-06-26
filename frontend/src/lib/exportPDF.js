/**
 * PDF export — format camerounais (IUGET / ENSPD / IAI).
 * 2 pages landscape : jours empilés verticalement, colonnes = groupes (GL-3A, GL-3B…)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCourseName } from './courseUtils';
import { getWeekDayLabels } from './weekConfig';

const HEADER_BLUE = [30, 58, 138];
const BORDER_GREY = [180, 180, 180];
const HOL_BG = [245, 245, 245];
const HOL_TEXT = [80, 80, 80];

function imgDims(doc, dataUrl, maxW, maxH) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      let w = maxW, h = maxW / ratio;
      if (h > maxH) { h = maxH; w = maxH * ratio; }
      resolve({ w, h });
    };
    img.onerror = () => resolve({ w: maxW, h: maxH });
    img.src = dataUrl;
  });
}

function toISO(d) { return d.toISOString().split('T')[0]; }

/** Map scheduler slot index → display slot index (by label). */
function buildSlotIndexMap(displaySlots, fullSlots) {
  const map = {};
  displaySlots.forEach((sl, di) => {
    const fi = fullSlots.findIndex(f => f.label === sl.label);
    if (fi !== -1) map[fi] = di;
    map[di] = di;
  });
  return (sessionSlot) => map[sessionSlot] ?? sessionSlot;
}

function sessionsForCell(sessions, dayIndex, displaySlotIdx, groupId, slotResolver) {
  return sessions.filter(s => {
    if (s.day !== dayIndex) return false;
    const resolved = slotResolver(s.slot);
    if (resolved !== displaySlotIdx) return false;
    if (groupId === '_all') return true;
    return s.groups?.includes(groupId);
  });
}

function slotsForDay(dayIndex, displaySlots, sessions, slotResolver, lang) {
  const used = new Set();
  sessions.forEach(s => {
    if (s.day === dayIndex) used.add(slotResolver(s.slot));
  });
  if (used.size === 0) return [];
  return displaySlots
    .map((sl, i) => ({ ...sl, displayIdx: i }))
    .filter(sl => used.has(sl.displayIdx));
}

function estimateDayHeight(rowCount, nGroups) {
  const rowH = nGroups > 6 ? 7 : 9;
  return 12 + rowCount * rowH + 8;
}

function renderDayTable(doc, {
  y, pageW, pageH, lang, numDays, dayIndex, weekDates, columnGroups,
  daySlots, displaySlots, allSessions, courseMap, lecturerMap, groupMap = {}, roomMap = {}, holidayMap, slotResolver,
  cellMode = 'group',
}) {
  const date = weekDates[dayIndex];
  const iso = toISO(date);
  const isHol = !!holidayMap[iso];
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const dayNames = getWeekDayLabels(numDays, lang);
  const dayTitle = `${dayNames[dayIndex]} — ${date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  const rowSlots = isHol ? [] : (daySlots.length ? daySlots : [{ label: lang === 'fr' ? '—' : '—', displayIdx: 0 }]);
  const estH = estimateDayHeight(Math.max(rowSlots.length, 1), columnGroups.length);
  if (y + estH > pageH - 12) {
    doc.addPage();
    y = 14;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(dayTitle.toUpperCase(), 8, y);
  y += 4;

  const tableW = pageW - 16;
  const timeColW = 20;
  const nGroups = Math.max(columnGroups.length, 1);
  const groupColW = (tableW - timeColW) / nGroups;
  const fontSize = Math.min(7, Math.max(4.5, groupColW * 0.42));

  const head = [
    { content: lang === 'fr' ? 'HORAIRE' : 'TIME', styles: { halign: 'center', fontSize: 5.5 } },
    ...columnGroups.map(g => ({
      content: g.name,
      styles: { halign: 'center', fontStyle: 'bold', fontSize: Math.min(6.5, fontSize + 0.5) },
    })),
  ];

  if (isHol) {
    const holName = lang === 'fr' ? holidayMap[iso].name_fr : holidayMap[iso].name_en;
    autoTable(doc, {
      startY: y,
      head: [head],
      body: [[
        { content: lang === 'fr' ? 'Férié' : 'Holiday', styles: { fontStyle: 'italic', fontSize: 5.5 } },
        { content: holName, colSpan: nGroups, styles: { halign: 'center', fillColor: HOL_BG, textColor: HOL_TEXT, fontStyle: 'italic', fontSize } },
        ...Array(nGroups - 1).fill({ content: '' }),
      ]],
      styles: { cellPadding: 1.5, lineColor: BORDER_GREY, lineWidth: 0.2, fontSize },
      headStyles: { fillColor: HEADER_BLUE, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: timeColW } },
      margin: { left: 8, right: 8 },
      tableWidth: tableW,
      pageBreak: 'avoid',
    });
    return (doc.lastAutoTable?.finalY || y) + 4;
  }

  if (rowSlots.length === 0) {
    autoTable(doc, {
      startY: y,
      head: [head],
      body: [[
        { content: '—', styles: { fontSize: 5.5, halign: 'center' } },
        { content: lang === 'fr' ? 'Pas de cours' : 'No classes', colSpan: nGroups, styles: { halign: 'center', fontStyle: 'italic', fontSize, textColor: [120, 120, 120] } },
        ...Array(nGroups - 1).fill({ content: '' }),
      ]],
      styles: { cellPadding: 1.5, lineColor: BORDER_GREY, lineWidth: 0.2, fontSize },
      headStyles: { fillColor: HEADER_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 5.5 },
      columnStyles: { 0: { cellWidth: timeColW } },
      margin: { left: 8, right: 8 },
      tableWidth: tableW,
      pageBreak: 'avoid',
    });
    return (doc.lastAutoTable?.finalY || y) + 4;
  }

  const body = rowSlots.map((slot) => {
    const row = [{
      content: slot.label.replace(' – ', '\n'),
      styles: { fontStyle: 'bold', fontSize: 5, halign: 'center', valign: 'middle', fillColor: [248, 250, 252] },
    }];

    columnGroups.forEach(g => {
      const cellSessions = sessionsForCell(allSessions, dayIndex, slot.displayIdx, g.id, slotResolver);
      const text = cellSessions.map(s => {
        const c = courseMap[s.courseId];
        const code = (c?.code || getCourseName(c, lang) || '?').toUpperCase();
        const sess = s.sessionNum && s.totalSessions ? ` (${s.sessionNum}/${s.totalSessions})` : '';
        const line1 = `${code}${sess}`;
        if (cellMode === 'lecturer') {
          // Teacher's own sheet: show which class(es) and room, not their own name.
          const grpNames = (s.groups || []).map(gid => groupMap[gid]?.name).filter(Boolean).join(', ');
          const room = roomMap[s.roomId]?.name;
          const extra = [grpNames, room].filter(Boolean).join(' · ');
          return extra ? `${line1}\n${extra}` : line1;
        }
        const l = lecturerMap[s.lecId];
        return l?.name ? `${line1}\n${l.name}` : line1;
      }).join('\n---\n');

      row.push({
        content: text || '',
        styles: { fontSize, valign: 'top', halign: 'left', textColor: [15, 15, 15], minCellHeight: 8 },
      });
    });
    return row;
  });

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    styles: { cellPadding: 1, overflow: 'linebreak', lineColor: BORDER_GREY, lineWidth: 0.2, fontSize },
    headStyles: { fillColor: HEADER_BLUE, textColor: 255, fontStyle: 'bold', fontSize: 5.5, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: timeColW, halign: 'center' },
      ...Object.fromEntries(columnGroups.map((_, i) => [i + 1, { cellWidth: groupColW }])),
    },
    margin: { left: 8, right: 8 },
    tableWidth: tableW,
    pageBreak: 'avoid',
  });

  return (doc.lastAutoTable?.finalY || y) + 4;
}

/** Split week into 2 page groups by estimated height (all days visible). */
function planTwoPages(numDays, displaySlots, sessions, slotResolver, nGroups, headerH, pageH) {
  const dayHeights = [];
  for (let di = 0; di < numDays; di++) {
    const daySlots = slotsForDay(di, displaySlots, sessions, slotResolver, 'fr');
    const rows = daySlots.length || 1;
    dayHeights.push(estimateDayHeight(rows, nGroups));
  }
  const budget1 = pageH - headerH - 10;
  let acc = 0;
  let splitAt = numDays;
  for (let di = 0; di < numDays; di++) {
    if (acc + dayHeights[di] > budget1 && di > 0) {
      splitAt = di;
      break;
    }
    acc += dayHeights[di];
  }
  if (splitAt >= numDays) splitAt = Math.ceil(numDays / 2);
  return [
    { start: 0, end: splitAt, label: null },
    { start: splitAt, end: numDays, label: true },
  ].filter(p => p.start < p.end);
}

export async function exportTimetablePDF({
  sessions,
  groups,
  courses,
  lecturers,
  rooms,
  holidays,
  settings,
  filterGroupId = null,
  perGroupIds = null,    // when set, render one class per page (Export all levels)
  perLecturerIds = null, // when set, render one teacher's personal sheet per page
  weekMonday,
  numDays = 5,
  allSlots,
  fullSlots = null,
  lang = 'fr',
  generatedBy = null,
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));
  const lecturerMap = Object.fromEntries(lecturers.map(l => [l.id, l]));
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const holidayMap = {};
  holidays.forEach(h => { holidayMap[h.date] = h; });

  const rawFull = fullSlots || allSlots;
  const displaySlots = allSlots.filter(s => !s.isBreak);
  const slotResolver = buildSlotIndexMap(displaySlots, rawFull);

  const weekDates = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(weekMonday);
    d.setDate(d.getDate() + i);
    return d;
  });

  let columnGroups = filterGroupId
    ? groups.filter(g => g.id === filterGroupId)
    : [...groups];
  if (columnGroups.length === 0) columnGroups = [{ id: '_all', name: lang === 'fr' ? 'Tous' : 'All' }];

  const filteredSessions = filterGroupId
    ? sessions.filter(s => s.groups?.includes(filterGroupId))
    : sessions;

  const renderHeader = async (yStart, compact = false) => {
    let y = yStart;
    const sideMargin = 8;
    const sideLogoMaxW = compact ? 22 : 28;
    const centerMaxW = pageW - sideLogoMaxW * 2 - sideMargin * 2;
    let logoBandH = 0;

    if (!compact && settings.logo2) {
      try {
        const dims = await imgDims(doc, settings.logo2, sideLogoMaxW, 16);
        logoBandH = Math.max(logoBandH, dims.h);
        doc.addImage(settings.logo2, 'PNG', sideMargin, y, dims.w, dims.h);
        doc.addImage(settings.logo2, 'PNG', pageW - sideMargin - dims.w, y, dims.w, dims.h);
      } catch { /* ignore */ }
    }

    if (!compact && settings.logo) {
      try {
        const dims = await imgDims(doc, settings.logo, Math.min(centerMaxW, 42), 18);
        logoBandH = Math.max(logoBandH, dims.h);
        doc.addImage(settings.logo, 'PNG', pageW / 2 - dims.w / 2, y, dims.w, dims.h);
      } catch { /* ignore */ }
    }

    y += logoBandH + (logoBandH > 0 ? 4 : 0);

    const textOpts = { align: 'center', maxWidth: centerMaxW };

    doc.setFontSize(compact ? 9 : 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    const instLines = doc.splitTextToSize(
      (settings.institutionName || 'Emploi du Temps').toUpperCase(),
      centerMaxW
    );
    doc.text(instLines, pageW / 2, y, textOpts);
    y += instLines.length * (compact ? 3.5 : 4);

    if (settings.schoolName && !compact) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const schoolLines = doc.splitTextToSize(settings.schoolName.toUpperCase(), centerMaxW);
      doc.text(schoolLines, pageW / 2, y, textOpts);
      y += schoolLines.length * 3;
    }
    if (settings.semester) {
      doc.setFontSize(compact ? 7 : 9);
      doc.setFont('helvetica', 'bolditalic');
      doc.setTextColor(20, 20, 20);
      const semLines = doc.splitTextToSize(
        (lang === 'fr' ? 'EMPLOI DU TEMPS — ' : 'TIME TABLE — ') + settings.semester.toUpperCase(),
        centerMaxW
      );
      doc.text(semLines, pageW / 2, y, textOpts);
      y += semLines.length * (compact ? 3 : 3.5);
    }
    if (settings.cohort && !compact) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const cohortLines = doc.splitTextToSize(settings.cohort.toUpperCase(), centerMaxW);
      doc.text(cohortLines, pageW / 2, y, textOpts);
      y += cohortLines.length * 3.5;
    }

    const weekEnd = weekDates[numDays - 1];
    const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
    const weekLabel = lang === 'fr'
      ? `Semaine du ${weekMonday.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} au ${weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`
      : `Week of ${weekMonday.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} to ${weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    const weekLines = doc.splitTextToSize(weekLabel, centerMaxW);
    doc.text(weekLines, pageW / 2, y, textOpts);
    y += weekLines.length * 3;

    doc.setFont('helvetica', 'bold');
    doc.text(`${settings.currentWeek || '?'}/${settings.totalWeeks || '?'}`, pageW - 12, y, { align: 'right' });
    y += 3.5;

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(90, 90, 90);
    const groupHint = lang === 'fr'
      ? `Colonnes = groupes/classes : ${columnGroups.map(g => g.name).join(', ')}`
      : `Columns = student groups: ${columnGroups.map(g => g.name).join(', ')}`;
    const hintLines = doc.splitTextToSize(groupHint, pageW - 20);
    doc.text(hintLines, pageW / 2, y, { align: 'center', maxWidth: pageW - 20 });
    return y + hintLines.length * 2.5 + 3;
  };

  const headerH = 48;

  // Render one complete timetable (header + day tables + signature) for the
  // given columns/sessions onto the current page(s) of the doc.
  const renderTimetableSection = async (cols, sess, cellMode = 'group') => {
    const pagePlan = planTwoPages(numDays, displaySlots, sess, slotResolver, cols.length, headerH, pageH);
    let y = await renderHeader(8, false);
    let pagePart = 0;

    for (const part of pagePlan) {
      if (pagePart > 0) {
        doc.addPage();
        y = 12;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        const partLabel = lang === 'fr' ? 'Semaine — suite' : 'Week — continued';
        doc.text(partLabel, pageW / 2, y, { align: 'center' });
        y += 7;
      }
      pagePart++;

      for (let di = part.start; di < part.end; di++) {
        const daySlots = slotsForDay(di, displaySlots, sess, slotResolver, lang);
        y = renderDayTable(doc, {
          y, pageW, pageH, lang, numDays, dayIndex: di, weekDates, columnGroups: cols,
          daySlots, displaySlots, allSessions: sess,
          courseMap, lecturerMap, groupMap, roomMap, holidayMap, slotResolver, cellMode,
        });
      }
    }

    const sigY = Math.min((doc.lastAutoTable?.finalY || y) + 6, pageH - 24);
    if (sigY < pageH - 18) {
      const city = settings.city || 'Douala';
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(lang === 'fr' ? `Fait à ${city}, le` : `Done in ${city}, the`, pageW / 2, sigY, { align: 'center' });
      const dateStr = weekMonday.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.setFont('helvetica', 'bold');
      doc.text(dateStr.toUpperCase(), pageW / 2, sigY + 4, { align: 'center' });
      const dirTitle = settings.directorTitle || (lang === 'fr' ? 'Le Directeur' : 'The Director');
      if (settings.schoolName) {
        doc.setFontSize(7);
        doc.text(`${dirTitle} ${lang === 'fr' ? 'de' : 'of'} ${settings.schoolName}`, pageW / 2, sigY + 8, { align: 'center' });
      }
    }
  };

  if (perLecturerIds && perLecturerIds.length) {
    // One teacher's personal sheet per page (cells show course · class · room).
    let first = true;
    for (const lid of perLecturerIds) {
      const l = lecturerMap[lid];
      if (!l) continue;
      const sess = sessions.filter(s => s.lecId === lid);
      if (sess.length === 0) continue;
      if (!first) doc.addPage();
      first = false;
      await renderTimetableSection([{ id: '_all', name: l.name }], sess, 'lecturer');
    }
    if (first) await renderTimetableSection(columnGroups, filteredSessions);
  } else if (perGroupIds && perGroupIds.length) {
    // One class per page — for handing each cohort/level its own sheet.
    let first = true;
    for (const gid of perGroupIds) {
      const g = groups.find(x => x.id === gid);
      if (!g) continue;
      const sess = sessions.filter(s => s.groups?.includes(gid));
      if (sess.length === 0) continue;
      if (!first) doc.addPage();
      first = false;
      await renderTimetableSection([g], sess);
    }
    if (first) await renderTimetableSection(columnGroups, filteredSessions); // nothing matched — fall back
  } else {
    await renderTimetableSection(columnGroups, filteredSessions);
  }

  const totalPages = doc.internal.getNumberOfPages();
  const traceDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const traceLine = generatedBy
    ? (lang === 'fr' ? `Généré par ${generatedBy} — ${traceDate}` : `Generated by ${generatedBy} — ${traceDate}`)
    : traceDate;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(traceLine, 8, pageH - 4);
    doc.text(`${lang === 'fr' ? 'Page' : 'Page'} ${i} / ${totalPages}`, pageW - 8, pageH - 4, { align: 'right' });
  }

  const groupSuffix = (perLecturerIds && perLecturerIds.length)
    ? (lang === 'fr' ? '-enseignants' : '-teachers')
    : (perGroupIds && perGroupIds.length)
    ? (lang === 'fr' ? '-tous-niveaux' : '-all-levels')
    : (filterGroupId ? `-${groups.find(g => g.id === filterGroupId)?.name || 'groupe'}` : '');
  const inst = (settings.institutionName || 'etablissement').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
  doc.save(`${inst}${groupSuffix}-semaine${settings.currentWeek || '1'}-${toISO(weekMonday)}.pdf`);
}
