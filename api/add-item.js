import { handler as netlifyHandler } from '../netlify/functions/add-item.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
