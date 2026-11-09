# Local Product Photography Assets

Place high-resolution WebP images here (e.g., `1200x900px` for 4:3 catalog cards, `1200x1200px` for Bestseller cards).
Recommended file size: < 120 KB per image.

Example naming:
- `noir-set-01.webp`
- `noir-set-02.webp`
- `knife-damascus-01.webp`

## Unused asset cleanup

Catalog Studio's **Clean Unused Assets** button scans only the `cutlery/`, `plates/`, and `placemats/`
folders above. A file is deleted only when no saved product references it, so images shared by
multiple products are never removed. Site icons, logos, and this README are outside the scan and
are never touched. Deletions are explicit and confirmed, and can be restored from Git if needed.
