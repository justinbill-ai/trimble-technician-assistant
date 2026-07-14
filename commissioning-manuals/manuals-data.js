/**
 * Trimble Earthworks v2.24 commissioning & installation manuals (local PDFs).
 */
var COMMISSIONING_MANUALS = {
  version: '2.24',
  title: 'Earthworks commissioning & installation manuals',
  subtitle: 'Trimble Earthworks v2.24 — commissioning and installation PDFs. Open in your browser; stored in this app (no Google Drive).',
  sections: [
    {
      id: 'commissioning',
      title: 'Commissioning manuals',
      manuals: [
        {
          id: 'excavator',
          label: 'Excavator',
          file: 'pdfs/trimble-earthworks-excavator-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'grader',
          label: 'Motor grader',
          file: 'pdfs/trimble-earthworks-grader-commissioning-manual-v-2-24-x.pdf',
        },
        {
          id: 'dozer',
          label: 'Dozer',
          file: 'pdfs/trimble-earthworks-dozer-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'wheel-loader',
          label: 'Wheel loader',
          file: 'pdfs/trimble-earthworks-wheel-loader-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'soil-compactor',
          label: 'Soil compactor',
          file: 'pdfs/trimble-earthworks-soil-compactor-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'landfill-compactor',
          label: 'Landfill compactor',
          file: 'pdfs/trimble-earthworks-landfill-compactor-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'towed-scraper',
          label: 'Towed scraper',
          file: 'pdfs/trimble-earthworks-towed-scraper-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'wheel-tractor-scraper',
          label: 'Wheel tractor scraper',
          file: 'pdfs/trimble-earthworks-wheel-tractor-scraper-commissioning-manual-v2-24-x.pdf',
        },
        {
          id: 'compact-loader-attachments',
          label: 'Compact loader attachments',
          file: 'pdfs/trimble-earthworks-compact-loader-attachments-commissioning-manual-2-24-x.pdf',
        },
        {
          id: 'smart-dozer-blade',
          label: 'Smart dozer blade attachment',
          file: 'pdfs/trimble-earthworks-smart-dozer-blade-attachment-commissioning-manual-2-24-x.pdf',
        },
      ],
    },
    {
      id: 'installation',
      title: 'Installation manuals',
      manuals: [
        {
          id: 'excavator-install',
          label: 'Excavator',
          file: 'pdfs/trimble-earthworks-excavator-installation-manual-v-2-24-x.pdf',
        },
        {
          id: 'grader-install',
          label: 'Motor grader',
          file: 'pdfs/trimble-earthworks-grader-installation-manual-v-2-24-x.pdf',
        },
        {
          id: 'dozer-install',
          label: 'Dozer',
          file: 'pdfs/trimble-earthworks-dozer-installation-manual-v2-24-x.pdf',
        },
        {
          id: 'wheel-loader-install',
          label: 'Wheel loader',
          file: 'pdfs/trimble-earthworks-wheel-loader-installation-manual-v2-24-x.pdf',
        },
        {
          id: 'soil-compactor-install',
          label: 'Soil compactor',
          file: 'pdfs/trimble-earthworks-soil-compactor-installation-manual-v2-24-x.pdf',
        },
        {
          id: 'towed-scraper-install',
          label: 'Towed scraper',
          file: 'pdfs/trimble-earthworks-towed-scraper-installation-manual-v2-24-x.pdf',
        },
        {
          id: 'ar-camera',
          label: 'AR camera',
          file: 'pdfs/trimble-earthworks-ar-camera-installation-manual-v2-24-x.pdf',
        },
      ],
    },
    {
      id: 'other',
      title: 'Reference',
      manuals: [
        {
          id: 'legal',
          label: 'Legal and regulatory information',
          file: 'pdfs/trimble-earthworks-legal-and-regulatory-information-v2-24-x.pdf',
        },
      ],
    },
  ],
};

/** Resolve manual file path by id (e.g. excavator, grader). */
function getCommissioningManualPath(manualId) {
  if (!COMMISSIONING_MANUALS || !manualId) return '';
  for (var s = 0; s < COMMISSIONING_MANUALS.sections.length; s++) {
    var section = COMMISSIONING_MANUALS.sections[s];
    for (var m = 0; m < section.manuals.length; m++) {
      if (section.manuals[m].id === manualId) {
        return section.manuals[m].file;
      }
    }
  }
  return '';
}
