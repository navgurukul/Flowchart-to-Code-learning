# Contributing to Flowchart-to-Code Learning

Thank you for your interest in contributing to this project! 🎉

We welcome contributions from developers, educators, researchers, and students. This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Research Contributions](#research-contributions)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members
- Give and receive constructive feedback gracefully

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

## 🎯 How Can I Contribute?

### 1. Reporting Bugs

Before creating a bug report:
- Check if the bug has already been reported
- Collect information about the bug (browser, OS, steps to reproduce)

When creating a bug report, include:
- Clear and descriptive title
- Detailed steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser console errors

**Template:**
```markdown
**Bug Description:**
A clear description of what the bug is.

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Device: [e.g., Desktop, Mobile]
```

### 2. Suggesting Enhancements

Enhancement suggestions are welcome! Please include:
- Clear use case and motivation
- Detailed description of the proposed feature
- Mockups or examples if applicable
- Consideration of educational impact

### 3. Code Contributions

We especially welcome contributions in these areas:

#### High Priority
- **Shape Detection Improvements**
  - Better geometric shape recognition
  - OpenCV.js integration
  - Arrow/line detection

- **OCR Integration**
  - Text extraction from shapes
  - Hindi language support
  - Handwriting recognition

- **Code Generation**
  - Support for more programming languages
  - Better code quality and formatting
  - Loop and conditional detection

#### Medium Priority
- **User Experience**
  - Mobile responsiveness
  - Accessibility improvements
  - Tutorial and onboarding

- **Testing**
  - Unit tests for core functions
  - Integration tests
  - E2E tests with Playwright/Cypress

#### Low Priority
- **Documentation**
  - Code comments
  - API documentation
  - Tutorial videos

## 💻 Development Setup

### Prerequisites

```bash
# Required
node >= 18.0.0
npm >= 9.0.0

# Optional (for LaTeX paper)
pdflatex (for compiling research paper)
```

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Flowchart-to-Code-learning.git
   cd Flowchart-to-Code-learning
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/navgurukul/Flowchart-to-Code-learning.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Project Structure

```
Flowchart-to-Code-learning/
├── src/
│   ├── components/        # React components
│   ├── services/          # Business logic
│   │   ├── yoloDetection.ts    # Shape detection
│   │   ├── analytics.ts        # Firebase analytics
│   │   └── api.ts              # API calls
│   ├── data/              # Lessons and exercises
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── public/                # Static assets
│   └── research.html      # Research paper
├── docs/                  # Documentation
│   └── paper/             # LaTeX paper source
└── tests/                 # Test files
```

## 📝 Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good
export const detectShapes = async (image: HTMLImageElement): Promise<Shape[]> => {
  // Clear function name, typed parameters and return
  const shapes = await yoloService.detect(image);
  return shapes.filter(shape => shape.confidence > 0.5);
};

// ❌ Bad
export const detect = async (img: any) => {
  // Unclear name, any type
  return await yoloService.detect(img);
};
```

### React Components

```typescript
// ✅ Good
interface FlowchartBuilderProps {
  exercise: Exercise;
  onGenerateCode: (flowchart: FlowchartData) => void;
}

export const FlowchartBuilder: React.FC<FlowchartBuilderProps> = ({
  exercise,
  onGenerateCode
}) => {
  // Component implementation
};

// ❌ Bad
export const FlowchartBuilder = (props: any) => {
  // Component implementation
};
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Ensure accessibility (ARIA labels, keyboard navigation)

```tsx
// ✅ Good
<button
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
  aria-label="Generate code from flowchart"
>
  Generate Code
</button>

// ❌ Bad
<button style={{padding: '8px 16px', background: 'blue'}}>
  Generate Code
</button>
```

## 📦 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(detection): add OpenCV.js shape detection

Integrate OpenCV.js for better geometric shape recognition.
Improves accuracy from 65% to 75% for simple flowcharts.

Closes #123

---

fix(flowchart): resolve node connection issue

Fixed bug where decision nodes weren't creating two branches.

---

docs(readme): update installation instructions

Added prerequisites and troubleshooting section.
```

## 🔄 Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and linting**
   ```bash
   npm run lint
   npm run type-check
   npm run test  # if tests exist
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link related issues

5. **PR Review Process**
   - Maintainers will review within 3-5 days
   - Address feedback and update PR
   - Once approved, maintainers will merge

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] No new warnings generated
```

## 🔬 Research Contributions

We welcome research contributions! If you're working on:

- Improving detection algorithms
- Novel code generation approaches
- Educational effectiveness studies
- Accessibility research

Please:
1. Document your methodology
2. Share results and findings
3. Consider publishing (we can help!)
4. Update the research paper if significant

### Updating the Research Paper

The research paper is available in two formats:
- HTML: `public/research.html`
- LaTeX: `docs/paper/paper.tex`

For significant contributions, please update both versions.

## 🎓 Educational Context

Remember that this project serves students from underserved communities. When contributing, consider:

- **Accessibility**: Works on low-end devices
- **Offline capability**: Minimal internet dependency
- **Transparency**: Students should understand how it works
- **Simplicity**: Clear, understandable code
- **Educational value**: Does it help students learn?

## 📧 Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Create an Issue
- **Security issues**: Email contact@navgurukul.org
- **Research collaboration**: Email contact@navgurukul.org

## 🙏 Thank You!

Every contribution, no matter how small, helps make programming education more accessible. Thank you for being part of this mission!

---

**NavGurukul Foundation for Social Welfare**

*Making quality programming education accessible to all*
