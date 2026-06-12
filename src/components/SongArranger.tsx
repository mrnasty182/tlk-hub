'use client';

import React, { useState } from 'react';

type SectionType = 'Intro' | 'Verse' | 'Pre-Chorus' | 'Chorus' | 'Bridge' | 'Solo' | 'Outro';

interface ArrangementSection {
  id: string;
  type: SectionType;
  key: string;
  bpm: number;
  bars: number;
}

interface SongMeta {
  title: string;
  key: string;
  bpm: number;
}

const KEYS = ['A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab'];

const BRAND = {
  hotPink: '#FF2D9B',
  electricTeal: '#00E5CC',
  deepViolet: '#7B2FBE',
  glamGold: '#F0C040',
  midnight: '#08060F',
  muted: '#6B6180',
  surface: '#130E20',
  card: '#0E0B18',
};

const SECTION_COLORS: Record<SectionType, string> = {
  Intro: '#7B2FBE',
  Verse: '#00E5CC',
  'Pre-Chorus': '#FF2D9B',
  Chorus: '#F0C040',
  Bridge: '#FF6B35',
  Solo: '#9D4EDD',
  Outro: '#06D6A0',
};

const SECTION_TYPES: SectionType[] = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Solo', 'Outro'];

const DEMO_ARRANGEMENT: ArrangementSection[] = [
  { id: '1', type: 'Intro', key: 'A', bpm: 124, bars: 4 },
  { id: '2', type: 'Verse', key: 'A', bpm: 124, bars: 4 },
  { id: '3', type: 'Chorus', key: 'A', bpm: 124, bars: 4 },
  { id: '4', type: 'Verse', key: 'A', bpm: 124, bars: 4 },
  { id: '5', type: 'Chorus', key: 'A', bpm: 124, bars: 4 },
  { id: '6', type: 'Bridge', key: 'D', bpm: 124, bars: 4 },
  { id: '7', type: 'Chorus', key: 'A', bpm: 124, bars: 8 },
];

function generateChordPro(meta: SongMeta, sections: ArrangementSection[]): string {
  const lines: string[] = [];
  lines.push(`{title: ${meta.title}}`);
  lines.push(`{key: ${meta.key}}`);
  lines.push(`{bpm: ${meta.bpm}}`);
  lines.push('');

  for (const section of sections) {
    lines.push(`[${section.type}]`);
    for (let b = 0; b < section.bars; b++) {
      const beat = b % 4 === 0 ? '1' : '';
      lines.push(`|${section.key}    |    |    |    |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default function SongArranger() {
  const [meta, setMeta] = useState<SongMeta>({ title: 'Stay Hard', key: 'A', bpm: 124 });
  const [sections, setSections] = useState<ArrangementSection[]>(DEMO_ARRANGEMENT);

  const addSection = (type: SectionType) => {
    const newSection: ArrangementSection = {
      id: Date.now().toString(),
      type,
      key: meta.key,
      bpm: meta.bpm,
      bars: 4,
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSections(updated);
  };

  const updateSection = (index: number, field: keyof ArrangementSection, value: string | number) => {
    setSections(
      sections.map((s, i) =>
        i === index ? { ...s, [field]: field === 'key' ? value : Number(value) } : s
      )
    );
  };

  const handleCopyChordPro = () => {
    const chordPro = generateChordPro(meta, sections);
    navigator.clipboard.writeText(chordPro).then(() => {
      alert('ChordPro copied to clipboard!');
    });
  };

  const handleSave = () => {
    console.log('Saved song:', { meta, sections });
    alert('Song saved successfully!');
  };

  const chordProPreview = generateChordPro(meta, sections);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: BRAND.midnight,
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 700,
            color: BRAND.hotPink,
            letterSpacing: '1px',
          }}
        >
          SONG ARRANGER
        </h1>
      </div>

      {/* Song Metadata */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: BRAND.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Song Title
          </label>
          <input
            type="text"
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            style={{
              backgroundColor: BRAND.card,
              border: `1px solid ${BRAND.deepViolet}`,
              borderRadius: '6px',
              color: '#fff',
              padding: '8px 12px',
              fontSize: '14px',
              width: '200px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: BRAND.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Key
          </label>
          <select
            value={meta.key}
            onChange={(e) => setMeta({ ...meta, key: e.target.value })}
            style={{
              backgroundColor: BRAND.card,
              border: `1px solid ${BRAND.deepViolet}`,
              borderRadius: '6px',
              color: '#fff',
              padding: '8px 12px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {KEYS.map((k) => (
              <option key={k} value={k} style={{ backgroundColor: BRAND.card }}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: BRAND.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            BPM
          </label>
          <input
            type="number"
            value={meta.bpm}
            onChange={(e) => setMeta({ ...meta, bpm: Number(e.target.value) })}
            style={{
              backgroundColor: BRAND.card,
              border: `1px solid ${BRAND.deepViolet}`,
              borderRadius: '6px',
              color: '#fff',
              padding: '8px 12px',
              fontSize: '14px',
              width: '80px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main content: two-column */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: '20px',
          minHeight: 0,
        }}
      >
        {/* Left panel: section library */}
        <div
          style={{
            flex: '0 0 35%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: BRAND.surface,
            borderRadius: '12px',
            border: `1px solid ${BRAND.deepViolet}40`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${BRAND.deepViolet}40`,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: BRAND.electricTeal,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Section Library
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: BRAND.muted }}>
              Click to add to arrangement
            </p>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {SECTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => addSection(type)}
                style={{
                  backgroundColor: `${SECTION_COLORS[type]}20`,
                  border: `2px solid ${SECTION_COLORS[type]}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: SECTION_COLORS[type],
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'background-color 0.15s, transform 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${SECTION_COLORS[type]}40`;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${SECTION_COLORS[type]}20`;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel: arrangement */}
        <div
          style={{
            flex: '0 0 65%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: BRAND.surface,
            borderRadius: '12px',
            border: `1px solid ${BRAND.deepViolet}40`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${BRAND.deepViolet}40`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: BRAND.hotPink,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Song Structure
            </h2>
            <span style={{ fontSize: '12px', color: BRAND.muted }}>
              {sections.length} section{sections.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
            }}
          >
            {sections.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: BRAND.muted,
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>🎸</div>
                Click a section type to add it to your song
              </div>
            ) : (
              sections.map((section, index) => (
                <div
                  key={section.id}
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.deepViolet}60`,
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Section type pill */}
                  <div
                    style={{
                      backgroundColor: SECTION_COLORS[section.type],
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      flexShrink: 0,
                    }}
                  >
                    {section.type}
                  </div>

                  {/* Key dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: BRAND.muted }}>Key:</label>
                    <select
                      value={section.key}
                      onChange={(e) => updateSection(index, 'key', e.target.value)}
                      style={{
                        backgroundColor: BRAND.surface,
                        border: `1px solid ${BRAND.deepViolet}60`,
                        borderRadius: '4px',
                        color: BRAND.glamGold,
                        padding: '4px 8px',
                        fontSize: '12px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {KEYS.map((k) => (
                        <option key={k} value={k} style={{ backgroundColor: BRAND.card }}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* BPM input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: BRAND.muted }}>BPM:</label>
                    <input
                      type="number"
                      value={section.bpm}
                      onChange={(e) => updateSection(index, 'bpm', e.target.value)}
                      style={{
                        backgroundColor: BRAND.surface,
                        border: `1px solid ${BRAND.deepViolet}60`,
                        borderRadius: '4px',
                        color: BRAND.electricTeal,
                        padding: '4px 8px',
                        fontSize: '12px',
                        width: '60px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Bars input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: BRAND.muted }}>Bars:</label>
                    <input
                      type="number"
                      value={section.bars}
                      onChange={(e) => updateSection(index, 'bars', e.target.value)}
                      min={1}
                      style={{
                        backgroundColor: BRAND.surface,
                        border: `1px solid ${BRAND.deepViolet}60`,
                        borderRadius: '4px',
                        color: '#fff',
                        padding: '4px 8px',
                        fontSize: '12px',
                        width: '50px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Spacer */}
                  <div style={{ flex: 1 }} />

                  {/* Reorder buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      style={{
                        background: 'none',
                        border: `1px solid ${BRAND.deepViolet}60`,
                        borderRadius: '4px',
                        color: index === 0 ? BRAND.muted : BRAND.electricTeal,
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        padding: '4px 8px',
                        fontSize: '14px',
                        lineHeight: 1,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (index !== 0) e.currentTarget.style.backgroundColor = `${BRAND.electricTeal}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      style={{
                        background: 'none',
                        border: `1px solid ${BRAND.deepViolet}60`,
                        borderRadius: '4px',
                        color: index === sections.length - 1 ? BRAND.muted : BRAND.electricTeal,
                        cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '4px 8px',
                        fontSize: '14px',
                        lineHeight: 1,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (index !== sections.length - 1)
                          e.currentTarget.style.backgroundColor = `${BRAND.electricTeal}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      ↓
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeSection(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: BRAND.muted,
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'color 0.15s, background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = BRAND.hotPink;
                      e.currentTarget.style.backgroundColor = `${BRAND.hotPink}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = BRAND.muted;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div
        style={{
          marginTop: '20px',
          backgroundColor: BRAND.surface,
          borderRadius: '12px',
          border: `1px solid ${BRAND.deepViolet}40`,
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: BRAND.glamGold,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            ChordPro Preview
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopyChordPro}
              style={{
                backgroundColor: `${BRAND.deepViolet}`,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.hotPink;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.deepViolet;
              }}
            >
              Copy ChordPro
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: BRAND.hotPink,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ff5bac';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRAND.hotPink;
              }}
            >
              Save Song
            </button>
          </div>
        </div>
        <pre
          style={{
            margin: 0,
            backgroundColor: BRAND.card,
            borderRadius: '8px',
            padding: '16px',
            fontSize: '13px',
            fontFamily: '"Space Mono", "Courier New", monospace',
            color: BRAND.electricTeal,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            border: `1px solid ${BRAND.deepViolet}30`,
          }}
        >
          {chordProPreview}
        </pre>
      </div>
    </div>
  );
}
