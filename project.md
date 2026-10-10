Project Desc:

We are building HR policy RAG System and our employee can ask question and HR can update the policy docs/polices by uploading docs and vice varca 

Tech stack:
- vue
- python with fastapi
- vector db
- postgres for database
- OpenAI

---

# HR Policy RAG System — Requirements

Scope: employees ask questions about HR policies; HR uploads and maintains policy documents.
Stack: Vue frontend, Python/FastAPI backend, vector database.

## Functional Requirements

### Employees (ask and read)
FR-1. An authenticated employee can submit a natural-language question about HR policies.
FR-2. The system returns an answer generated only from the employee's currently active policy documents.
FR-3. Each answer lists the source documents and the exact text section it was taken from.
FR-4. An employee can open the source document at the cited section.
FR-5. An employee can see the full text of any active policy document.
FR-6. An employee can filter the document list by category (leave, payroll, benefits, conduct, etc.).
FR-7. An employee can search documents by keyword.
FR-8. If no policy supports an answer, the system says so and shows the closest available documents instead of answering.
FR-9. An employee can see previous answers from their own account.
FR-10. An employee can rate an answer (helpful / not helpful).

### HR (upload and maintain)
FR-11. An HR user can upload a policy document (PDF, DOCX, TXT, Markdown).
FR-12. On upload, the system extracts the text, splits it into sections, and makes each section searchable.
FR-13. HR sees the upload status of every document: queued, processing, indexed, failed.
FR-14. HR can edit document metadata: title, category, version, effective date, expiry date.
FR-15. HR can replace the file of an existing policy. The system keeps the previous version and marks it inactive.
FR-16. HR can activate, deactivate, or archive a policy document.
FR-17. HR can delete a policy document. Its content is removed from search and answers.
FR-18. HR sees search terms with no matching policy, to find content gaps.
FR-19. HR can read every employee's question and answer log.
FR-20. HR can re-ask a logged question to check whether the answer changed after an update.

### Access control
FR-21. Access is limited to company employees. Non-employees are rejected at sign-in.
FR-22. Every request is authenticated. Unauthenticated requests are rejected.
FR-23. Only HR accounts can upload, edit, activate, or delete policies.
FR-24. Deactivated, expired, and archived policies are excluded from employee search and answers.
FR-25. An employee can only read their own answer history and ratings.

### Answer and document handling
FR-26. Every answer is stored with the question, the source document sections, and the model response.
FR-27. Answers can cite a specific policy version, so a reader can see which version answered the question.
FR-28. If sources disagree, the system states the conflict and shows both sections rather than merging them.
FR-29. Document text is kept in full and is never replaced by a summary.
FR-30. HR can add a short note to a policy section that is shown alongside the cited text.

## Non-Functional Requirements

### Availability
NFR-1. The service is available 99.5% of working hours, excluding scheduled maintenance.
NFR-2. Planned maintenance is announced at least 48 hours ahead and happens outside working hours.
NFR-3. A failed answer request returns an error message and does not show a partial or empty answer as if it were a result.
NFR-4. A failed upload keeps the document in a failed state with a stated reason and can be retried.

### Performance
NFR-5. 95% of answers are returned in under 8 seconds. 99% under 15 seconds.
NFR-6. Search results and document lists load in under 1 second.
NFR-7. An uploaded document is searchable within 2 minutes of upload for documents under 100 pages.
NFR-8. Interactive pages load in under 2 seconds on a standard company laptop and office network.

### Scale
NFR-9. Support 2,000 registered employees and 200 documents in the first year.
NFR-10. Support growth to 10,000 employees and 5,000 documents without changing the architecture.
NFR-11. Support 100 concurrent users, with 25 concurrent answer requests.

### Accuracy
NFR-12. At least 85% of answers on a test set of 200 HR questions are correct and supported by a cited source.
NFR-13. Answers that do not pass the support check are refused rather than returned.
NFR-14. The answer test set is reviewed and approved by HR before release and re-run after any model or prompt change.

### Security
NFR-15. All traffic is over HTTPS.
NFR-16. Documents and questions are stored with access limited to the application service account.
NFR-17. Data sent to a third-party model provider is limited to the retrieved sections for the current question. No document is sent for training.
NFR-18. Passwords are stored hashed. Sessions expire after 12 hours of inactivity.
NFR-19. Every document change, including upload, edit, activation, and deletion, is logged with the user and timestamp.
NFR-20. Logs and answer records do not store document text.

### Compliance
NFR-21. Documents are retained in the system for as long as HR requires, with deletion supported on request.
NFR-22. Retention and deletion of employee answer history is defined and applied on a set schedule.
NFR-23. Any document or question containing health, payroll, or disciplinary details is visible only to roles HR designates.
NFR-24. The data location and processor list are recorded and reviewed before production use.

### Privacy
NFR-25. The system collects no employee data beyond the account record and question history.
NFR-26. HR can read a question log only for the purpose of answering and improving policies.

### Operability
NFR-27. Failed requests, indexing failures, and model errors are recorded with enough detail to diagnose them.
NFR-28. There is a documented daily backup of documents, metadata, and question history, with a restore tested at least quarterly.
NFR-29. Onboarding and policy updates are documented for HR users who are not technical.

### Compatibility and accessibility
NFR-30. The application works in the two most recent versions of Chrome, Edge, and Firefox.
NFR-31. The application works on mobile browser at a usable width of 320px.
NFR-32. The interface is keyboard navigable and passes WCAG 2.1 AA contrast.
NFR-33. Question and answer text is available to screen readers.

### Quality
NFR-34. Automated tests cover every functional requirement listed above that can be checked without a running model.
NFR-35. Automated tests cover answer refusal when no source supports the question.
NFR-36. CI runs tests and linting on every change before merge.
NFR-37. Test coverage on backend business logic is at least 70%.
NFR-38. Answer content is not stored or served as HTML; it is rendered as text.