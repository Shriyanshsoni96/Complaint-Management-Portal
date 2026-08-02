import { Component } from 'react';
import ServerErrorPage from '../../pages/errors/ServerErrorPage.jsx';

// React error boundaries must be class components - there is no hook
// equivalent for getDerivedStateFromError/componentDidCatch.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
