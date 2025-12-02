import { handler as netlifyHandler } from '../netlify/functions/brooch-categories.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
