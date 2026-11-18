import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqlynqerhdijfknataxe.supabase.co'
const supabaseKey = 'sb_publishable_QyDy0f0_4BhfILXb7PGUVA_bn83aKHU'

export const supabase = createClient(supabaseUrl, supabaseKey)