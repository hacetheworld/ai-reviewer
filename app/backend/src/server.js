import 'dotenv/config';
import app from './app.js';
import { info } from './utils/logger.js';

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  info(`Backend listening on :${port}`);
});
