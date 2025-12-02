import { handler as netlifyHandler } from '../netlify/functions/width-rules.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
