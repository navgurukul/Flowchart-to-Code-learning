# LaTeX Paper Compilation Instructions

## For arXiv Submission

### Prerequisites
- LaTeX distribution (TeX Live, MiKTeX, or MacTeX)
- pdflatex compiler

### Compile the Paper

```bash
# Compile once
pdflatex paper.tex

# Compile twice for references
pdflatex paper.tex
pdflatex paper.tex
```

### For arXiv Submission

1. **Prepare files:**
   ```bash
   # Create submission directory
   mkdir arxiv-submission
   cp paper.tex arxiv-submission/
   # Add any figures if you have them
   ```

2. **Create tarball:**
   ```bash
   cd arxiv-submission
   tar -czf ../arxiv-submission.tar.gz *
   ```

3. **Upload to arXiv:**
   - Go to https://arxiv.org/submit
   - Upload `arxiv-submission.tar.gz`
   - Select category: cs.CV (Computer Vision) or cs.CY (Computers and Society)
   - Follow arXiv submission guidelines

### Alternative: Overleaf

1. Go to https://www.overleaf.com/
2. Create new project
3. Upload `paper.tex`
4. Compile online
5. Download PDF or submit directly to arXiv from Overleaf

## Local PDF Generation

### Using pdflatex (Recommended)
```bash
pdflatex paper.tex
```

### Using latexmk (Automatic)
```bash
latexmk -pdf paper.tex
```

### Clean auxiliary files
```bash
rm -f *.aux *.log *.out *.toc *.bbl *.blg
```

## Required LaTeX Packages

All packages used are standard and included in most LaTeX distributions:
- inputenc (UTF-8 encoding)
- fontenc (Font encoding)
- times (Times font)
- amsmath, amssymb (Math symbols)
- graphicx (Graphics)
- hyperref (Hyperlinks)
- url (URLs)
- booktabs (Professional tables)
- algorithm, algorithmic (Algorithms)
- enumitem (List formatting)
- geometry (Page margins)

## Customization

### Change Paper Size
```latex
\documentclass[11pt,letterpaper]{article}  % For US Letter
\documentclass[11pt,a4paper]{article}      % For A4 (current)
```

### Adjust Margins
```latex
\usepackage[margin=1in]{geometry}          % Current
\usepackage[margin=1.5in]{geometry}        % Wider margins
```

### Add Authors
```latex
\author{
    Author One\thanks{Equal contribution}\\
    NavGurukul Foundation\\
    \texttt{author1@navgurukul.org}
    \and
    Author Two\thanks{Equal contribution}\\
    NavGurukul Foundation\\
    \texttt{author2@navgurukul.org}
}
```

## Common Issues

### Missing Packages
```bash
# Ubuntu/Debian
sudo apt-get install texlive-full

# macOS
brew install --cask mactex

# Windows
# Download and install MiKTeX from https://miktex.org/
```

### Compilation Errors
- Run pdflatex twice to resolve references
- Check for special characters that need escaping: `& % $ # _ { } ~ ^`
- Ensure all `\begin{...}` have matching `\end{...}`

## Output

After successful compilation, you'll get:
- `paper.pdf` - The final paper
- `paper.aux` - Auxiliary file (can be deleted)
- `paper.log` - Compilation log (can be deleted)
- `paper.out` - Hyperref output (can be deleted)

## arXiv Categories

Suggested categories for submission:
- **Primary:** cs.CV (Computer Vision and Pattern Recognition)
- **Secondary:** cs.CY (Computers and Society)
- **Alternative:** cs.HC (Human-Computer Interaction)

## License

This LaTeX template and paper content are released under MIT License, consistent with the NavGurukul project.

---

**Questions?** Contact: contact@navgurukul.org
