import reactRefresh from '@vitejs/plugin-react-refresh';
import mdx from 'vite-plugin-mdx';
import path from 'path';

export default {
  plugins: [reactRefresh(), mdx()],
  resolve: {
    alias: {
      'packages': path.resolve(__dirname, './packages')
    }
  }
}
