# Change Log

All notable changes to the "nyarcode-xlf-editor" extension will be documented in this file.

## [0.0.4] - 2026-02-09

### Fixed

- HTML paragraph tags (`<p>`) are now preserved correctly when pasting HTML content
- Line breaks (`<br>`) inside paragraphs are automatically converted to separate paragraphs when saving
- Empty paragraphs (`<p></p>` and `<p><br></p>`) are automatically removed when saving
- Standalone `<br>` tags outside paragraphs are cleaned up when saving

### Changed

- Expanded list of allowed HTML tags to include: `p`, `br`, `strong`, `em`, `u`, `s`, `sup`, `sub`, `a`, `ul`, `ol`, `li`
- Improved HTML paste handling to better preserve formatting and structure

## [0.0.3] - 2026-01-08

### Fixed

- HTML tags are now properly encoded as entities (e.g., `&lt;p&gt;` instead of `<p>`) when saving translations, fixing import issues in Magnolia CMS

### Added

- Copy to translation button to quickly copy original text to translation field
- File name now displayed in panel title with unsaved changes indicator (●)
- Version number displayed in About page
- Session persistence: open XLF editor panels are now restored when reopening VS Code

### Changed

- Prevent duplicate tabs: opening the same file multiple times now focuses the existing tab instead of creating duplicates
- Better resource management: improved performance and memory usage

# [0.0.2] - 2025-12-17

### Changed
- Improved editing and saving of translations.
- Rich text editing powered by Trumbowyg.
- UI and user experience improvements.

## [0.0.1] - 2025-12-09

### Added
- Initial release
- XLF/XLIFF file editor with visual interface
- Context menu integration for .xlf and .xliff files
- Activity Bar sidebar for easy access
- Support only for Magnolia CMS XLF files