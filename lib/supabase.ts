import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sqpegmzobxleabmzwgpk.supabase.co'
const supabaseKey = 'sb_publishable_BYkHe7X5y5z3xjP5C7y0mQ_9fU0z2T2'

export const supabase = createClient(supabaseUrl, supabaseKey) 
