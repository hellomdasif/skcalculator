import { handler as netlifyHandler } from '../netlify/functions/extra-charges.js';
import { adaptNetlifyHandler } from './_netlifyAdapter.js';

export default adaptNetlifyHandler(netlifyHandler);
