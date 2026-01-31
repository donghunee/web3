import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name
export const SCREENSHOT_BUCKET = 'screen-images'

// Upload screenshot to Supabase Storage
export async function uploadScreenshot(file: File, projectId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${projectId}/${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(fileName, file)

  if (error) {
    console.error('Error uploading screenshot:', error)
    return null
  }

  const { data } = supabase.storage
    .from(SCREENSHOT_BUCKET)
    .getPublicUrl(fileName)

  return data.publicUrl
}

// Database types
export interface Project {
  id: string
  name: string
  domain: string
  description: string | null
  target_users: string | null
  created_at: string
  updated_at: string
}

export interface Screen {
  id: string
  project_id: string
  name: string
  image_url: string | null
  description: string | null
  purpose: string
  key_actions: string[] | null
  created_at: string
  updated_at: string
}

// Create a new project
export async function createProject(data: {
  name: string
  domain: string
  description: string
  target_users?: string
}): Promise<Project | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: data.name,
      domain: data.domain,
      description: data.description,
      target_users: data.target_users || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return null
  }

  return project
}

// Create a new screen
export async function createScreen(data: {
  project_id: string
  name: string
  purpose: string
  key_actions: string[]
  image_url?: string | null
}): Promise<Screen | null> {
  const { data: screen, error } = await supabase
    .from('screens')
    .insert({
      project_id: data.project_id,
      name: data.name,
      purpose: data.purpose,
      key_actions: data.key_actions,
      image_url: data.image_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating screen:', error)
    return null
  }

  return screen
}

// Get all projects
export async function getAllProjects(): Promise<Project[]> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return projects || []
}

// Get project by ID
export async function getProjectById(id: string): Promise<Project | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return project
}

// Get screen by ID
export async function getScreenById(id: string): Promise<Screen | null> {
  const { data: screen, error } = await supabase
    .from('screens')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching screen:', error)
    return null
  }

  return screen
}

// Get screens by project ID
export async function getScreensByProjectId(projectId: string): Promise<Screen[]> {
  const { data: screens, error } = await supabase
    .from('screens')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching screens:', error)
    return []
  }

  return screens || []
}

// Evaluation result types
export interface EvaluationResultDB {
  id: string
  screen_id: string | null
  screen_name: string
  overall_score: number
  total_strengths: number
  total_improvements: number
  summary: string
  categories: unknown // JSONB
  created_at: string
}

// Save evaluation result
export async function saveEvaluationResult(data: {
  screen_id?: string | null
  screen_name: string
  overall_score: number
  total_strengths: number
  total_improvements: number
  summary: string
  categories: unknown
}): Promise<EvaluationResultDB | null> {
  const insertData = {
    screen_id: data.screen_id || null,
    screen_name: data.screen_name,
    overall_score: data.overall_score,
    total_strengths: data.total_strengths,
    total_improvements: data.total_improvements,
    summary: data.summary,
    categories: data.categories,
  }

  console.log('Saving evaluation result:', insertData)

  const { data: result, error } = await supabase
    .from('evaluation_results')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error saving evaluation result:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }

  console.log('Evaluation result saved:', result)
  return result
}

// Get evaluation results by screen ID
export async function getEvaluationResultsByScreenId(screenId: string): Promise<EvaluationResultDB[]> {
  const { data: results, error } = await supabase
    .from('evaluation_results')
    .select('*')
    .eq('screen_id', screenId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching evaluation results:', error)
    return []
  }

  return results || []
}

// Get all evaluation results
export async function getAllEvaluationResults(): Promise<EvaluationResultDB[]> {
  const { data: results, error } = await supabase
    .from('evaluation_results')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all evaluation results:', error)
    return []
  }

  return results || []
}

// Get single evaluation result by ID
export async function getEvaluationResultById(id: string): Promise<EvaluationResultDB | null> {
  const { data: result, error } = await supabase
    .from('evaluation_results')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching evaluation result:', error)
    return null
  }

  return result
}

// Delete evaluation result
export async function deleteEvaluationResult(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('evaluation_results')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting evaluation result:', error)
    return false
  }

  return true
}

// Save project criteria (selected heuristics)
export async function saveProjectCriteria(projectId: string, criteriaIds: string[]): Promise<boolean> {
  // First, get all criteria
  const { data: allCriteria, error: criteriaError } = await supabase
    .from('evaluation_criteria')
    .select('id, name')

  if (criteriaError) {
    console.error('Error fetching criteria:', criteriaError)
    return false
  }

  // Create project_criteria entries
  const projectCriteria = allCriteria?.map(criterion => ({
    project_id: projectId,
    criteria_id: criterion.id,
    is_enabled: criteriaIds.some(id =>
      criterion.name.toLowerCase().includes(id.replace('-', ' ')) ||
      id.includes(criterion.name.toLowerCase())
    ),
  })) || []

  const { error } = await supabase
    .from('project_criteria')
    .insert(projectCriteria)

  if (error) {
    console.error('Error saving project criteria:', error)
    return false
  }

  return true
}
