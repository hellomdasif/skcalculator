import { handler as netlifyHandler } from '../netlify/functions/get-items.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
