import { handler as netlifyHandler } from '../netlify/functions/delete-item.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
