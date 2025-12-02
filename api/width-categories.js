import { handler as netlifyHandler } from '../netlify/functions/width-categories.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
