import { state, recordGap, persist } from './store'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'my', 'me', 'can', 'to',
  'of', 'for', 'on', 'in', 'and', 'or', 'if', 'it', 'we', 'our', 'you', 'your',
  'how', 'what', 'when', 'where', 'many', 'much', 'with', 'be', 'have', 'has',
])

function tokens(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
}

/* Curated answers. Each is written from one policy section so the citation
   always matches the text that is shown next to it. */
const CURATED = [
  {
    keywords: ['annual leave', 'leave entitlement', 'leave allowance', 'leave policy', 'vacation', 'pto'],
    docId: 'doc-leave',
    section: '1. Annual leave entitlement',
    answer:
      'Full-time employees get 24 days of paid annual leave per calendar year, accrued monthly at two days for each completed month of service. Leave starts accruing from your first day, so someone who joins mid-year begins with a part-month balance rather than a full year’s allowance.\n\nPart-time employees get the same entitlement pro-rated to their contracted hours.',
  },
  {
    keywords: ['carry over', 'carryover', 'carry forward', 'encash', 'lapse'],
    docId: 'doc-leave',
    section: '2. Carry-over and encashment',
    answer:
      'Up to 10 unused days carry into the following year, and they have to be used before 31 March. Of that carried-over balance, up to 5 days can be encashed when you leave; anything beyond that lapses.\n\nEncashment is paid at your last drawn basic salary and needs a written request to People Operations at least 14 days before your last working day.',
  },
  {
    keywords: ['sick leave', 'sick day', 'medical certificate', 'unpaid sick'],
    docId: 'doc-leave',
    section: '3. Sick leave',
    answer:
      'You get 12 days of paid sick leave per calendar year, available in full from day one. Three consecutive working days or more requires a medical certificate, sent to People Operations within seven days of you returning.\n\nUnpaid sick leave can only be taken after the 12 days are used up, and your reporting manager has to approve it in advance.',
  },
  {
    keywords: ['maternity', 'paternity', 'parental'],
    docId: 'doc-leave',
    section: '4. Maternity and paternity leave',
    answer:
      'After 12 months of continuous service you get 26 weeks of paid maternity leave, or 12 weeks of paid paternity leave, at full basic salary. A further 2 weeks of unpaid parental leave can be taken within three months of the paid period ending.\n\nBenefits continue and equity vesting keeps running through the paid leave.',
  },
  {
    keywords: ['notice period', 'resign', 'resignation'],
    docId: 'doc-leave',
    section: '5. Leave request and approval',
    answer:
      'Leave has to be requested in the HR portal before you take it, and your reporting manager approves it within two working days. Five or more consecutive days need three weeks notice.\n\nIf you are asking about resigning: probation notice is 2 weeks, and the full notice terms are handled through People Operations rather than the leave policy.',
  },
  {
    keywords: ['payslip', 'pay day', 'payday', 'salary paid', 'when is salary'],
    docId: 'doc-payroll',
    section: '1. Pay cycle and payslips',
    answer:
      'Salary is paid on the last working day of each month by bank transfer to the account registered with People Operations. The payslip is issued on the same day in the HR portal and kept for seven years.\n\nBank detail changes have to go through the portal — emailed changes are never processed.',
  },
  {
    keywords: ['salary review', 'increment', 'hike', 'pay rise', 'appraisal'],
    docId: 'doc-payroll',
    section: '2. Salary review cycle',
    answer:
      'Salary reviews run annually in April and cover the previous review year. Every permanent employee is assessed against the expectations recorded at the start of that year.\n\nThere are three outcomes: no change, a percentage increase inside your band, or an adjustment outside band, which needs People Operations approval and a written justification.',
  },
  {
    keywords: ['deduction', 'tax', 'net pay', 'retirement contribution'],
    docId: 'doc-payroll',
    section: '3. Statutory deductions',
    answer:
      'Deductions are limited to income tax, social insurance contributions, and court-ordered amounts. You can submit a standing instruction to deduct up to 30% of net pay toward a benefit such as a retirement contribution, and change or withdraw it with 30 days notice.',
  },
  {
    keywords: ['final settlement', 'notice pay', 'termination pay', 'exit payment'],
    docId: 'doc-payroll',
    section: '4. Salary on termination',
    answer:
      'Notice-period salary is part of the final settlement and is paid on your last working day. Leave you accrued but did not take is encashed at the rate that applied during the notice period.\n\nSettlement is completed within 30 days of your last working day, once company property has been returned.',
  },
  {
    keywords: ['remote day', 'office days', 'hybrid', 'which days', 'friday', 'wfh'],
    docId: 'doc-remote',
    section: '1. Working pattern',
    answer:
      'You are in the office on Tuesday, Wednesday and Thursday. Friday is a company-wide remote day.\n\nA manager can approve a different anchor pattern for a team where customer or production coverage needs it, and that pattern is written into the team agreement rather than agreed informally.',
  },
  {
    keywords: ['work from another', 'travel', 'temporary remote', 'relocate', 'relocation'],
    docId: 'doc-remote',
    section: '2. Working from another location',
    answer:
      'You can work somewhere other than your assigned office for up to 20 working days per calendar year, with manager approval and a maximum of 5 consecutive days. The request goes in at least 10 working days ahead and has to satisfy data residency rules for the host country.\n\nIf you meant a permanent relocation rather than short trips, there is no policy in place for that — it would go to People Operations as a case.',
  },
  {
    keywords: ['desk allowance', 'laptop', 'equipment', 'home office', 'expense', 'monitor', 'peripherals'],
    docId: 'doc-remote',
    section: '3. Equipment and expenses',
    answer:
      'The company provides a laptop, external display and peripherals. On top of that you can claim up to 2,400 per calendar year for approved home office equipment through the expenses portal, with a receipt.\n\nA desk allowance of 200 per month is available on a hybrid pattern and is claimed as a payroll allowance, not through expenses.',
  },
  {
    keywords: ['core hours', 'availability', 'attendance', 'timezone', 'reachable'],
    docId: 'doc-remote',
    section: '4. Availability during remote days',
    answer:
      'On a remote day you are expected to be reachable during core hours of 10:00–16:00 in your assigned office time zone. The HR portal is the single record of presence, leave and working hours.',
  },
  {
    keywords: ['harassment', 'grievance', 'discrimination', 'misconduct'],
    docId: 'doc-conduct',
    section: '4. Grievance and harassment',
    answer:
      'If you are experiencing or witnessing harassment you can raise a grievance with People Operations. Grievances are handled separately from disciplinary matters and kept as confidential as the process allows.\n\nHR assigns you a named contact at the point you raise it.',
  },
  {
    keywords: ['disciplinary', 'warning', 'dismissal', 'fired', 'appeal'],
    docId: 'doc-conduct',
    section: '3. Disciplinary procedure',
    answer:
      'People Operations reviews the alleged misconduct, interviews you and any witnesses, and gives you the allegations in writing. The outcome is a recorded warning, a final warning, or dismissal.\n\nYou can appeal within 10 working days of receiving the written outcome.',
  },
  {
    keywords: ['report a concern', 'whistleblower', 'ethics line', 'retaliation'],
    docId: 'doc-conduct',
    section: '2. Reporting a concern',
    answer:
      'You can raise a concern with your manager, with People Operations, or through the confidential ethics line, which is answered within two working days. Retaliation against anyone who raises a concern in good faith is itself a disciplinary matter.\n\nAnonymous reports are accepted, but they limit what the company can follow up.',
  },
  {
    keywords: ['insurance', 'medical cover', 'dependents', 'health cover', 'claim'],
    docId: 'doc-benefits',
    section: '1. Medical insurance',
    answer:
      'Medical insurance covers you, a spouse and up to two dependent children, starting the first day of the month after you join. The company pays the full employee premium and 80% of the dependent premium.\n\nClaims go through the insurer portal and are settled within 15 working days of complete documentation.',
  },
  {
    keywords: ['retirement', 'pension', 'vesting'],
    docId: 'doc-benefits',
    section: '2. Retirement contribution',
    answer:
      'The company contributes 6% of basic salary to the retirement plan and you can add 2% to 15%. Contributions vest fully after 3 years of service. The rate is reviewed each April alongside the salary review.',
  },
  {
    keywords: ['learning budget', 'wellness', 'training budget', 'certification'],
    docId: 'doc-benefits',
    section: '3. Other benefits',
    answer:
      'There is a learning budget of 1,500 per calendar year for approved courses and certifications, and an annual wellness allowance of 600. Both are claimed through the expenses portal and are available from your first day.',
  },
  {
    keywords: ['probation', 'confirmation'],
    docId: 'doc-probation',
    section: '1. Probation period',
    answer:
      'Probation runs 3 months for junior roles and 6 months for senior roles. It can be extended once, by up to 2 months, where performance concerns are documented in writing. Notice during probation is 2 weeks for either side.',
  },
  {
    keywords: ['incident', 'near miss', 'injury', 'accident', 'ergonomic'],
    docId: 'doc-safety',
    section: '1. Reporting an incident',
    answer:
      'Any injury or near miss must be reported to the office manager the same day and recorded in the incident register within 24 hours. Get medical attention first and report afterwards — nobody is penalised for reporting late.',
  },
  {
    keywords: ['approved tool', 'third party', 'tools register', 'data residency'],
    docId: 'doc-data',
    section: '2. Approved tools',
    answer:
      'Only approved tools may process company data. Before entering employee personal data into any third-party service, check that the service is listed as approved in the tools register. Data must not go into a tool that has not been assessed.',
  },
  {
    keywords: ['retention', 'how long', 'delete', 'anonymise'],
    docId: 'doc-data',
    section: '3. Retention',
    answer:
      'Employee records are kept for the duration of employment and for seven years after the last working day. Payroll records follow the statutory period in each country of employment. Once a retention period ends, records are deleted or anonymised.',
  },
]

const STOP_PHRASES = [
  'sabbatical', 'on-call', 'on call compensation', 'night shift', 'shift allowance',
  'visa sponsorship', 'sponsorship', 'crèche', 'creche', 'gym membership',
]

function answerFor(question) {
  const q = question.toLowerCase()
  const docSections = []
  for (const doc of state.documents) {
    if (doc.status !== 'active') continue
    for (const section of doc.sections) {
      docSections.push({ doc, section })
    }
  }

  /* A longer keyword is a stronger signal than a generic one, and a phrase near
     the end of the question usually carries the intent ("... can I carry over?"). */
  const curated = CURATED.map((entry) => {
    let score = 0
    for (const keyword of entry.keywords) {
      const at = q.indexOf(keyword)
      if (at === -1) continue
      score += 1 + keyword.length / 40 + (at / q.length) * 0.25
    }
    return { entry, score }
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)[0]

  if (curated) {
    const { entry } = curated
    const match = docSections.find(
      ({ doc, section }) => doc.id === entry.docId && section.heading === entry.section,
    )
    if (match) {
      return {
        outcome: 'answered',
        content: entry.answer,
        sources: [
          {
            documentId: match.doc.id,
            title: match.doc.title,
            version: match.doc.version,
            section: match.section.heading,
            excerpt: match.section.body,
            note: match.doc.note,
          },
        ],
      }
    }
  }

  /* No curated answer. Fall back to lexical retrieval over policy sections. */
  const terms = tokens(question)
  const scored = docSections
    .map(({ doc, section }) => {
      const haystack = `${section.heading} ${section.body} ${(section.keywords || []).join(' ')}`
        .toLowerCase()
      let score = 0
      for (const term of terms) if (haystack.includes(term)) score += 1
      for (const key of section.keywords || []) {
        if (q.includes(key.toLowerCase())) score += 2
      }
      return { doc, section, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1)

  if (scored.length && scored[0].score >= 3) {
    const top = scored[0]
    const content = `No policy answers this directly, so here is the closest text we hold, quoted in full.\n\n${top.section.heading}\n${top.section.body}\n\nIf this does not settle your question, send it to People Operations and ask them to either answer it or write it into a policy.`
    return {
      outcome: 'answered',
      content,
      sources: [
        {
          documentId: top.doc.id,
          title: top.doc.title,
          version: top.doc.version,
          section: top.section.heading,
          excerpt: top.section.body,
          note: top.doc.note,
        },
      ],
    }
  }

  const gapTerm =
    STOP_PHRASES.find((p) => q.includes(p)) ||
    terms.slice(0, 3).join(' ').replace(/^./, (c) => c.toUpperCase())

  recordGap(gapTerm)

  return {
    outcome: 'refused',
    content:
      'Nothing in the active policies covers this, so there is nothing to quote. People Operations can answer it directly or write it into a policy — this search has been recorded so the gap gets noticed.',
    sources: [],
    gapTerm,
  }
}

export async function askQuestion(question) {
  await wait(500 + Math.random() * 600)
  const result = answerFor(question)
  return {
    id: `m-${Date.now()}`,
    role: 'assistant',
    createdAt: new Date().toISOString(),
    ...result,
  }
}

export async function simulatedUpload(file) {
  const doc = {
    id: `doc-${Date.now()}`,
    title: file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '),
    category: 'Uncategorised',
    version: '1.0',
    status: 'active',
    effectiveDate: null,
    expiryDate: null,
    pages: Math.max(1, Math.round(file.size / 40000)),
    fileName: file.name,
    fileType: (file.name.split('.').pop() || '').toUpperCase(),
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    indexStatus: 'indexing',
    updatedAt: new Date().toISOString(),
    updatedBy: 'You',
    note: '',
    sections: [],
  }
  state.documents.unshift(doc)
  persist()
  await wait(2200)
  doc.indexStatus = 'indexed'
  doc.sections = [
    {
      id: `sec-${doc.id}-1`,
      heading: '1. Scope',
      body: `This document was uploaded by People Operations on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Sections were extracted automatically on upload. Review the text before publishing it as active.`,
      keywords: ['scope', 'overview'],
    },
  ]
  persist()
  return doc
}

export async function reaskQuestion(question) {
  await wait(700 + Math.random() * 500)
  return answerFor(question)
}
