# NyarCode XLF Editor

A Visual Studio Code extension for reading and editing XLF (XLIFF) files from Magnolia CMS.

## Features

- **Visual XLF Editor**: Edit XLF/XLIFF translation files with an intuitive interface
- **Context Menu Integration**: Right-click on `.xlf` or `.xliff` file to open the editor
- **Sidebar Access**: Quick access via the Activity Bar sidebar
- **For Magnolia CMS**: Optimized for Magnolia CMS translation files

## Usage

### Opening XLF Files

There are three ways to open an XLF file with the editor:

1. **Right-click** on any `.xlf` or `.xliff` file in the Explorer and select "XLF Editor: Open editor"
2. **Click** on the NyarCode XLF Editor icon in the Activity Bar (left sidebar)
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run "XLF Editor: Open editor"

### Editing Translations

The editor provides a user-friendly interface to view and edit translation units in your XLF files.

## Requirements

- Visual Studio Code 1.85.0 or higher

## Extension Settings

This extension does not add any VS Code settings.

## Known Issues

None at the moment. Please report issues on the [GitHub repository](https://github.com/nyarcode/magnolia-cms-xlf-editor-vscode-extension/issues).

## Release Notes

## [0.0.4] <span style="font-size: smaller;">2026-02-09</span>

### Fixed

- HTML paragraph tags (`<p>`) are now preserved correctly when pasting HTML content
- Line breaks (`<br>`) inside paragraphs are automatically converted to separate paragraphs when saving
- Empty paragraphs (`<p></p>` and `<p><br></p>`) are automatically removed when saving
- Standalone `<br>` tags outside paragraphs are cleaned up when saving

### Changed

- Expanded list of allowed HTML tags to include: `p`, `br`, `strong`, `em`, `u`, `s`, `sup`, `sub`, `a`, `ul`, `ol`, `li`
- Improved HTML paste handling to better preserve formatting and structure

## [0.0.3] <span style="font-size: smaller;">2026-01-08</span>

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

## [0.0.2] <span style="font-size: smaller;">2025-12-17</span>

### Added

- Rich text editing powered by Trumbowyg.

### Changed

- Improved editing and saving of translations.
- UI and user experience improvements.

## [0.0.1] <span style="font-size: smaller;">2025-12-09</span>

Initial release of NyarCode XLF Editor

### Added

- Basic XLF file editing functionality
- Context menu integration for .xlf files
- Sidebar view for quick access

## License

[MIT](LICENSE)

---

**Enjoy!**
