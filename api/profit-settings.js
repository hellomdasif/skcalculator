import { handler as netlifyHandler } from '../netlify/functions/profit-settings.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
