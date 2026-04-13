import React from 'react';

/**
 * Renders the Localization Dropdown and the Font Size Toggle controls.
 */
export default function AccessibilityTools({
  lang,
  setLang,
  LANGUAGES,
  langDropdownOpen,
  setLangDropdownOpen,
  langDropdownRef,
  fontSize,
  cycleFontSize,
  FONT_SIZE_LABELS
}) {
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <>
      {/* Language Picker */}
      <div className="kiosk__lang-picker" ref={langDropdownRef}>
        <button
          className={`kiosk__lang-btn ${lang !== 'en' ? 'kiosk__lang-btn--active' : ''}`}
          onClick={() => setLangDropdownOpen(prev => !prev)}
          title="Change language"
        >
          <span className="kiosk__lang-flag">{currentLang.flag}</span>
          <span className="kiosk__lang-code">{currentLang.code.toUpperCase()}</span>
          <span className="kiosk__lang-arrow">{langDropdownOpen ? '▲' : '▼'}</span>
        </button>
        {langDropdownOpen && (
          <div className="kiosk__lang-dropdown">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`kiosk__lang-option ${lang === l.code ? 'kiosk__lang-option--active' : ''}`}
                onClick={() => {
                  setLang(l.code)
                  setLangDropdownOpen(false)
                }}
              >
                <span className="kiosk__lang-option-flag">{l.flag}</span>
                <span className="kiosk__lang-option-label">{l.label}</span>
                {lang === l.code && <span className="kiosk__lang-option-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size Toggle */}
      <button
        className={`kiosk__font-toggle ${fontSize !== 'normal' ? 'kiosk__font-toggle--active' : ''}`}
        onClick={cycleFontSize}
        title={`Text size: ${fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Large' : 'Extra Large'}`}
      >
        <span className="kiosk__font-toggle-icon">🔤</span>
        <span className="kiosk__font-toggle-label">{FONT_SIZE_LABELS[fontSize]}</span>
      </button>
    </>
  );
}
