# TMD Diagnostic App 🦷

A modern, responsive web application for Temporomandibular Joint Disorder (TMD) assessment and screening. Built with React, TypeScript, and Vite.

## Features ✨

- **Quick Assessment**: 1-minute screening for immediate risk evaluation
- **Comprehensive Assessment**: 3-question detailed screening
- **Multi-language Support**: English, Russian, and Chinese
- **Dark/Light Theme**: Toggle between themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Professional UI**: Modern glassmorphism design with smooth animations
- **Progress Tracking**: Visual progress indicators for assessments
- **Results Analysis**: Detailed risk assessment with personalized recommendations
- **PDF Export**: Generate comprehensive reports (simulated)

## Tech Stack 🛠️

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern features (Grid, Flexbox, CSS Variables)
- **State Management**: React Hooks + LocalStorage

## Getting Started 🚀

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd DDS-TMD-App-FINAL-REVIEWED
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to:

```
http://localhost:5173
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## App Structure 📁

```
src/
├── components/
│   ├── ErrorBoundary.tsx    # Error handling component
│   └── ThemeAndLangToggle.tsx # Theme and language switcher
├── views/
│   ├── HomeView.tsx         # Landing page
│   ├── QuickAssessmentView.tsx # Quick screening
│   ├── ComprehensiveView.tsx   # Full assessment
│   └── ResultView.tsx       # Results and recommendations
├── App.tsx                  # Main app component with routing
├── main.tsx                 # App entry point
├── i18n.ts                  # Internationalization
└── styles.css               # Global styles
```

## Features in Detail 🔍

### Assessment Types

1. **Quick Assessment**
   - Single question format
   - Text-based response
   - Immediate risk evaluation
   - Perfect for initial screening

2. **Comprehensive Assessment**
   - 3 structured questions
   - Yes/No format
   - Detailed scoring system
   - Professional recommendations

### Risk Categories

- **Low Risk** 🟢: Monitor and maintain
- **Moderate Risk** 🟡: Consider full diagnosis
- **High Risk** 🔴: Consult specialist immediately

### Multi-language Support

The app supports three languages:

- English (en)
- Russian (ru)
- Chinese (zh)

Language preference is stored in localStorage and persists across sessions.

### Theme System

Two theme options:

- **Light Theme**: Clean, professional appearance
- **Dark Theme**: Easy on the eyes, modern look

Theme preference is stored in localStorage and persists across sessions.

## User Experience 🎯

### Navigation

- Intuitive navigation with clear call-to-action buttons
- Progress indicators for multi-step processes
- Breadcrumb-style navigation for easy backtracking

### Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast ratios
- Responsive design for all screen sizes

### Performance

- Fast loading with Vite
- Optimized bundle size
- Smooth animations and transitions
- Efficient state management

## Medical Disclaimer ⚠️

This application is designed for educational and screening purposes only. It should not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for proper evaluation and treatment of TMD or any other medical condition.

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

For support or questions, please open an issue in the repository or contact the development team.

---

**Built with ❤️ for better dental health awareness**
