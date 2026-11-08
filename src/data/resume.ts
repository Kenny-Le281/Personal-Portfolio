// Single source of truth for the whole site. Update the resume here.

export const profile = {
  name: 'Kenny Le',
  handle: 'kenny',
  title: 'Software Engineering @ uOttawa',
  role: 'Platform Engineer Co-op @ JSI',
  tagline: 'I build internal platforms, data pipelines and the tooling that makes developers faster.',
  location: 'Ottawa, ON',
  email: 'kennyle281@gmail.com',
  github: 'https://github.com/Kenny-Le281',
  // TODO(kenny): the resume shows "linkedin.com/in/kenny", which looks truncated. Replace with your real profile URL.
  linkedin: 'https://www.linkedin.com/in/kenny',
  resume: `${import.meta.env.BASE_URL}Kenny_Resume.pdf`,
};

export type SkillCategory = 'languages' | 'frameworks' | 'tools';

export interface Skill {
  id: string;
  label: string;
  category: SkillCategory;
}

export const skills: Skill[] = [
  { id: 'python', label: 'Python', category: 'languages' },
  { id: 'go', label: 'Go', category: 'languages' },
  { id: 'csharp', label: 'C#', category: 'languages' },
  { id: 'java', label: 'Java', category: 'languages' },
  { id: 'typescript', label: 'TypeScript', category: 'languages' },
  { id: 'javascript', label: 'JavaScript', category: 'languages' },
  { id: 'cpp', label: 'C++', category: 'languages' },
  { id: 'sql', label: 'SQL', category: 'languages' },

  { id: 'react', label: 'React', category: 'frameworks' },
  { id: 'vite', label: 'Vite', category: 'frameworks' },
  { id: 'flask', label: 'Flask', category: 'frameworks' },
  { id: 'playwright', label: 'Playwright', category: 'frameworks' },
  { id: 'pandas', label: 'Pandas', category: 'frameworks' },
  { id: 'numpy', label: 'NumPy', category: 'frameworks' },

  { id: 'aws', label: 'AWS (EKS, S3)', category: 'tools' },
  { id: 'kubernetes', label: 'Kubernetes', category: 'tools' },
  { id: 'crossplane', label: 'Crossplane', category: 'tools' },
  { id: 'fluxcd', label: 'FluxCD', category: 'tools' },
  { id: 'opentofu', label: 'OpenTofu', category: 'tools' },
  { id: 'docker', label: 'Docker', category: 'tools' },
  { id: 'postgresql', label: 'PostgreSQL', category: 'tools' },
  { id: 'gcp', label: 'GCP', category: 'tools' },
  { id: 'git', label: 'Git', category: 'tools' },
  { id: 'gh-actions', label: 'GitHub Actions', category: 'tools' },
  { id: 'copilot', label: 'GitHub Copilot', category: 'tools' },
  { id: 'azure-devops', label: 'Azure DevOps', category: 'tools' },
  { id: 'linux', label: 'Linux', category: 'tools' },
];

export const categoryLabels: Record<SkillCategory, string> = {
  languages: 'Languages',
  frameworks: 'Frameworks & Libraries',
  tools: 'Developer Tools',
};

export type PodStatus = 'Running' | 'Completed';
export type Namespace = 'experience' | 'projects' | 'education';

export interface Metric {
  key: string;
  display: string;
  /** 0..1 fill for the gauge */
  fill: number;
  hint?: string;
}

export interface Pod {
  id: string;
  namespace: Namespace;
  title: string;
  org: string;
  location?: string;
  start: string;
  end: string;
  status: PodStatus;
  summary: string;
  events: string[];
  skills: string[];
  metrics: Metric[];
  stack?: string;
  demo?: 'nexthome';
}

export const pods: Pod[] = [
  {
    id: 'jsi-platform',
    namespace: 'experience',
    title: 'Platform Engineer Co-op',
    org: 'Jatom Systems Inc (JSI)',
    location: 'Ottawa, ON',
    start: 'Sep 2026',
    end: 'Present',
    status: 'Running',
    summary: 'Internal Developer Platform on AWS EKS: self-service tenants, GitOps, and a Go CLI.',
    events: [
      'Automated multi-tenant provisioning for an Internal Developer Platform (IDP) on AWS EKS with Crossplane, deploying namespaces, PostgreSQL, S3 and Keycloak identities from a single resource to enable self-service onboarding.',
      'Built Time-To-Live (TTL) expiration and self-service renewal for tenant environments, reclaiming idle resources and reducing cloud waste by 50%.',
      'Automated Kubernetes deployments using FluxCD and GitOps, enabling ordered cluster updates from Git.',
      'Developed a Go CLI enabling self-service access to IDP resources while abstracting Kubernetes complexity.',
    ],
    skills: ['go', 'kubernetes', 'aws', 'crossplane', 'fluxcd', 'postgresql', 'git', 'linux'],
    metrics: [
      { key: 'cloud-waste', display: '-50%', fill: 0.5, hint: 'idle resources reclaimed via TTL' },
      { key: 'tenant-setup', display: '1 file', fill: 1, hint: 'one resource → namespace + DB + S3 + identity' },
    ],
  },
  {
    id: 'jsi-devtools',
    namespace: 'experience',
    title: 'Software Developer Co-op',
    org: 'Jatom Systems Inc (JSI)',
    location: 'Ottawa, ON',
    start: 'Jan 2026',
    end: 'Apr 2026',
    status: 'Completed',
    summary: 'AI enablement hub for GitHub Copilot and an Azure DevOps notification bot.',
    events: [
      'Built an AI Enablement hub for GitHub Copilot, standardizing PRD-to-production repositories with integrated agents, skills, tools and hooks, contributing to 70% adoption of AI-assisted development.',
      'Developed an Azure DevOps notification bot in C# that tracks work items based on user-defined subscription criteria and sends real-time alerts when matching items are created or updated.',
    ],
    skills: ['csharp', 'copilot', 'azure-devops', 'git'],
    metrics: [{ key: 'ai-adoption', display: '70%', fill: 0.7, hint: 'AI-assisted development adoption' }],
  },
  {
    id: 'zagora-data',
    namespace: 'experience',
    title: 'Software Developer & Data Analyst Co-op',
    org: 'Black Ridge - Gestion Zagora',
    location: 'Montreal, QC',
    start: 'May 2025',
    end: 'Sep 2025',
    status: 'Completed',
    summary: 'ETL pipelines, 35+ automations, a property analytics map and property websites.',
    events: [
      'Designed and maintained Python-based ETL pipelines to extract ERP data via APIs, unifying, cleaning and transforming datasets across platforms for accurate reporting.',
      'Built 35+ automation solutions for discrepancy detection, contract management and data validation, saving 20 hours/week in manual effort and generating $30K in annual savings.',
      'Delivered an interactive property analytics map (Folium, Docker, GCP) with secure hashed-password access, cutting data lookup time from 10 min to < 1 min.',
      'Led development of responsive property websites (React, Vite) with booking form integrations and leasing APIs, improving leads by 35%.',
    ],
    skills: ['python', 'pandas', 'numpy', 'sql', 'docker', 'gcp', 'react', 'vite'],
    metrics: [
      { key: 'automations', display: '35+', fill: 0.88 },
      { key: 'hours-saved', display: '20 h/wk', fill: 0.5 },
      { key: 'savings', display: '$30K/yr', fill: 0.75 },
      { key: 'lookup-time', display: '10m → <1m', fill: 0.9 },
      { key: 'leads', display: '+35%', fill: 0.35 },
    ],
  },
  {
    id: 'nexthomeai',
    namespace: 'projects',
    title: 'NextHomeAI',
    org: 'Personal project',
    start: 'Jan 2026',
    end: 'Present',
    status: 'Running',
    stack: 'Python, React, PostgreSQL, Playwright, GitHub',
    summary: 'Full-stack AI real-estate search with a local-LLM chatbot (Ollama / Llama 3.1).',
    events: [
      'Built a full-stack AI real estate app using React and Python with a chatbot powered by local LLMs (Ollama / Llama 3.1) for natural-language property search.',
      'Engineered an NLP pipeline converting unstructured queries into structured database filters with JSON validation and error recovery.',
      'Built an ETL pipeline to ingest, clean and standardize real estate listing data, storing it in PostgreSQL.',
      'Orchestrated the backend AI flow by classifying user intent and routing requests to tools for response generation.',
    ],
    skills: ['python', 'react', 'postgresql', 'playwright', 'sql', 'git'],
    metrics: [],
    demo: 'nexthome',
  },
  {
    id: 'uottawa',
    namespace: 'education',
    title: 'BASc Software Engineering (Co-op)',
    org: 'University of Ottawa',
    location: 'Ottawa, ON',
    start: 'Sep 2024',
    end: 'Expected 2029',
    status: 'Running',
    summary: "CGPA 9.40 / 10 (3.95 / 4.0) · Dean's Honour List 2024–2026.",
    events: [
      'CGPA: 9.40 / 10.0 (3.95 / 4.0).',
      "Dean's Honour List (2024–2026).",
      'Relevant coursework: Data Structures & Algorithms, Software Engineering, Computer Architecture, Digital Systems, Discrete Mathematics, Web Development.',
    ],
    skills: ['java', 'cpp', 'javascript', 'typescript'],
    metrics: [{ key: 'cgpa', display: '9.40 / 10', fill: 0.94 }],
  },
];

export const podById = (id: string) => pods.find((p) => p.id === id);
export const skillById = (id: string) => skills.find((s) => s.id === id);
export const podsUsingSkill = (skillId: string) => pods.filter((p) => p.skills.includes(skillId));
