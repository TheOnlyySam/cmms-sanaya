import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'src/store';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfTwoTone';
import KeyboardArrowUpTwoToneIcon from '@mui/icons-material/KeyboardArrowUpTwoTone';
import KeyboardArrowDownTwoToneIcon from '@mui/icons-material/KeyboardArrowDownTwoTone';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import CmPmReport, {
  CmPmReportSegment,
  CmPmReportStatus,
  CmPmReportType
} from 'src/models/owns/cmPmReport';
import {
  addCmPmReport,
  deleteCmPmReport,
  duplicateCmPmReport,
  editCmPmReport,
  exportCmPmReportPdf,
  getCmPmReport,
  getCmPmReports,
  getCmPmReportTemplates
} from 'src/slices/cmPmReport';

const statuses: CmPmReportStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'ARCHIVED'];
const reportTypes: CmPmReportType[] = ['CM', 'PM'];

const defaultMetadata = {
  fieldLabels: {
    projectName: 'Project Name',
    clientName: 'Client / Beneficiary',
    contractorName: 'Contractor',
    reportType: 'Type of Report',
    facilityLocation: 'Facility Location',
    systemLocation: 'System Location / Zone',
    equipmentId: 'System ID / Siren ID / Equipment ID',
    reportRef: 'Report Reference Number',
    reportDate: 'Report Date',
    preparedBy: 'Prepared By'
  }
};

const emptyReport = (): Partial<CmPmReport> => ({
  reportRef: '',
  reportType: 'CM',
  title: '',
  projectName: '',
  clientName: '',
  contractorName: '',
  facilityLocation: '',
  systemLocation: '',
  equipmentId: '',
  reportDate: new Date().toISOString().slice(0, 10),
  preparedBy: '',
  status: 'DRAFT',
  metadata: defaultMetadata,
  segments: []
});

const newSegment = (type: CmPmReportSegment['type']): CmPmReportSegment => {
  const id = Math.random().toString(36).slice(2);
  if (type === 'table') {
    return {
      id,
      type,
      title: 'Table Segment',
      config: { columns: ['Task', 'Status', 'Reading', 'Comment'] },
      content: { rows: [] }
    };
  }
  if (type === 'checklist') {
    return {
      id,
      type,
      title: 'Checklist / Status Segment',
      config: {
        statuses: [
          'Normal / OK',
          'Warning / Observation',
          'Critical / Failed',
          'Checked',
          'Not Checked',
          'Yes',
          'No'
        ]
      },
      content: { items: [] }
    };
  }
  if (type === 'signature') {
    return {
      id,
      type,
      title: 'Signature / Acceptance Segment',
      content: {
        parties: [
          { label: 'Contractor Representative', name: '', title: '', date: '', signature: '' },
          { label: 'Client Representative', name: '', title: '', date: '', signature: '' }
        ]
      }
    };
  }
  return { id, type, title: 'Text Box Segment', content: { text: '' } };
};

function formatDate(value: any) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function CmPmReports() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const { reports, singleReport, templates, loading } = useSelector((state) => state.cmPmReports);
  const [filters, setFilters] = useState<any>({});
  const [draft, setDraft] = useState<Partial<CmPmReport>>(emptyReport());
  const [templateKey, setTemplateKey] = useState('');
  const [preview, setPreview] = useState(false);
  const selectedId = reportId ? Number(reportId) : null;

  useEffect(() => {
    dispatch(getCmPmReports({}));
    dispatch(getCmPmReportTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (selectedId) dispatch(getCmPmReport(selectedId));
    else setDraft(emptyReport());
  }, [dispatch, selectedId]);

  useEffect(() => {
    if (singleReport && selectedId === singleReport.id) {
      setDraft({
        ...singleReport,
        reportDate: formatDate(singleReport.reportDate),
        metadata: singleReport.metadata || defaultMetadata,
        segments: singleReport.segments || []
      });
    }
  }, [singleReport, selectedId]);

  const fieldLabels = useMemo(() => draft.metadata?.fieldLabels || defaultMetadata.fieldLabels, [draft.metadata]);

  const setField = (key: string, value: any) => setDraft((current) => ({ ...current, [key]: value }));
  const setSegment = (index: number, segment: CmPmReportSegment) => {
    const segments = [...(draft.segments || [])];
    segments[index] = segment;
    setField('segments', segments);
  };

  const save = async (status?: CmPmReportStatus) => {
    const payload = { ...draft, status: status || draft.status };
    const saved: any = selectedId
      ? await dispatch(editCmPmReport(selectedId, payload))
      : await dispatch(addCmPmReport(payload, templateKey || undefined));
    await dispatch(getCmPmReports(filters));
    if (saved?.id) navigate(`/app/cm-pm-reports/${saved.id}`);
  };

  const filteredReports = reports;

  return (
    <>
      <Helmet>
        <title>CM-PM Reports</title>
      </Helmet>
      <PageTitleWrapper>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3">CM-PM Reports</Typography>
            <Typography variant="subtitle2">Corrective and preventive maintenance report builder</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AddTwoToneIcon />} onClick={() => navigate('/app/cm-pm-reports')}>
              New
            </Button>
            <Button variant="contained" startIcon={<SaveTwoToneIcon />} onClick={() => save()}>
              Save Draft
            </Button>
          </Stack>
        </Stack>
      </PageTitleWrapper>

      <Container maxWidth="xl">
        <Grid container spacing={2}>
          <Grid item xs={12} lg={5}>
            <Card>
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select label="Type" value={filters.reportType || ''} onChange={(e) => setFilters({ ...filters, reportType: e.target.value || null })}>
                        <MenuItem value="">All</MenuItem>
                        {reportTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select label="Status" value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}>
                        <MenuItem value="">All</MenuItem>
                        {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Reference" value={filters.reportRef || ''} onChange={(e) => setFilters({ ...filters, reportRef: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Client" value={filters.clientName || ''} onChange={(e) => setFilters({ ...filters, clientName: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Facility Location" value={filters.facilityLocation || ''} onChange={(e) => setFilters({ ...filters, facilityLocation: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.startDate || ''} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.endDate || ''} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button fullWidth variant="outlined" disabled={loading} onClick={() => dispatch(getCmPmReports(filters))}>
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Paper sx={{ mt: 2, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} hover selected={selectedId === report.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{report.reportRef}</Typography>
                        <Typography variant="caption">{report.clientName} / {report.facilityLocation}</Typography>
                      </TableCell>
                      <TableCell>{report.reportType}</TableCell>
                      <TableCell>{report.projectName}</TableCell>
                      <TableCell><Chip size="small" label={report.status} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => navigate(`/app/cm-pm-reports/${report.id}`)}><VisibilityTwoToneIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => dispatch(duplicateCmPmReport(report.id)).then((copy: any) => navigate(`/app/cm-pm-reports/${copy.id}`))}><ContentCopyTwoToneIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => dispatch(exportCmPmReportPdf(report.id)).then((url: string) => window.open(url, '_blank'))}><PictureAsPdfTwoToneIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => dispatch(deleteCmPmReport(report.id))}><DeleteTwoToneIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Card>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Create from Template</InputLabel>
                    <Select label="Create from Template" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                      <MenuItem value="">Blank report</MenuItem>
                      {templates.map((template) => <MenuItem key={template.key} value={template.key}>{template.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Button variant="outlined" onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</Button>
                  <Button variant="contained" onClick={() => save('SUBMITTED')}>Submit</Button>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><TextField fullWidth required label={fieldLabels.reportRef} value={draft.reportRef || ''} onChange={(e) => setField('reportRef', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label="Report Title" value={draft.title || ''} onChange={(e) => setField('title', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{fieldLabels.reportType}</InputLabel>
                      <Select label={fieldLabels.reportType} value={draft.reportType || 'CM'} onChange={(e) => setField('reportType', e.target.value)}>
                        {reportTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth required type="date" label={fieldLabels.reportDate} InputLabelProps={{ shrink: true }} value={formatDate(draft.reportDate)} onChange={(e) => setField('reportDate', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth required label={fieldLabels.projectName} value={draft.projectName || ''} onChange={(e) => setField('projectName', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label={fieldLabels.clientName} value={draft.clientName || ''} onChange={(e) => setField('clientName', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label={fieldLabels.contractorName} value={draft.contractorName || ''} onChange={(e) => setField('contractorName', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label={fieldLabels.facilityLocation} value={draft.facilityLocation || ''} onChange={(e) => setField('facilityLocation', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label={fieldLabels.systemLocation} value={draft.systemLocation || ''} onChange={(e) => setField('systemLocation', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label={fieldLabels.equipmentId} value={draft.equipmentId || ''} onChange={(e) => setField('equipmentId', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth label={fieldLabels.preparedBy} value={draft.preparedBy || ''} onChange={(e) => setField('preparedBy', e.target.value)} /></Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select label="Status" value={draft.status || 'DRAFT'} onChange={(e) => setField('status', e.target.value)}>
                        {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={1} sx={{ my: 2, flexWrap: 'wrap', gap: 1 }}>
              {(['text', 'table', 'checklist', 'signature'] as CmPmReportSegment['type'][]).map((type) => (
                <Button key={type} size="small" variant="outlined" startIcon={<AddTwoToneIcon />} onClick={() => setField('segments', [...(draft.segments || []), newSegment(type)])}>
                  {type}
                </Button>
              ))}
            </Stack>

            <Stack spacing={2}>
              {(draft.segments || []).map((segment, index) => (
                <SegmentEditor
                  key={segment.id}
                  segment={segment}
                  index={index}
                  preview={preview}
                  onChange={(updated) => setSegment(index, updated)}
                  onDelete={() => setField('segments', (draft.segments || []).filter((_, i) => i !== index))}
                  onDuplicate={() => setField('segments', [...(draft.segments || []).slice(0, index + 1), { ...segment, id: Math.random().toString(36).slice(2) }, ...(draft.segments || []).slice(index + 1)])}
                  onMove={(direction) => {
                    const next = [...(draft.segments || [])];
                    const target = index + direction;
                    if (target < 0 || target >= next.length) return;
                    [next[index], next[target]] = [next[target], next[index]];
                    setField('segments', next);
                  }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

function SegmentEditor({ segment, index, preview, onChange, onDelete, onDuplicate, onMove }) {
  const set = (patch: Partial<CmPmReportSegment>) => onChange({ ...segment, ...patch });
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={() => onMove(-1)}><KeyboardArrowUpTwoToneIcon /></IconButton>
          <IconButton size="small" onClick={() => onMove(1)}><KeyboardArrowDownTwoToneIcon /></IconButton>
          <TextField fullWidth size="small" label={`Section ${index + 1}`} value={segment.title} onChange={(e) => set({ title: e.target.value })} />
          <Chip size="small" label={segment.type} />
          <IconButton size="small" onClick={() => set({ collapsed: !segment.collapsed })}>{segment.collapsed ? <KeyboardArrowDownTwoToneIcon /> : <KeyboardArrowUpTwoToneIcon />}</IconButton>
          <IconButton size="small" onClick={onDuplicate}><ContentCopyTwoToneIcon /></IconButton>
          <IconButton size="small" color="error" onClick={onDelete}><DeleteTwoToneIcon /></IconButton>
        </Stack>
        <Collapse in={!segment.collapsed}>
          <Divider sx={{ my: 2 }} />
          {segment.type === 'table' && <TableSegment segment={segment} onChange={onChange} preview={preview} />}
          {segment.type === 'checklist' && <ChecklistSegment segment={segment} onChange={onChange} preview={preview} />}
          {segment.type === 'signature' && <SignatureSegment segment={segment} onChange={onChange} preview={preview} />}
          {segment.type === 'text' && (
            preview ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>{segment.content?.text}</Typography> :
              <TextField fullWidth multiline minRows={5} label="Text" value={segment.content?.text || ''} onChange={(e) => onChange({ ...segment, content: { text: e.target.value } })} />
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

function TableSegment({ segment, onChange, preview }) {
  const columns: string[] = segment.config?.columns || [];
  const rows: any[] = segment.content?.rows || [];
  const update = (nextColumns = columns, nextRows = rows) => onChange({ ...segment, config: { ...segment.config, columns: nextColumns }, content: { ...segment.content, rows: nextRows } });
  return (
    <Box>
      {!preview && (
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
          {columns.map((column, i) => <TextField key={i} size="small" label="Column" value={column} onChange={(e) => { const next = [...columns]; next[i] = e.target.value; update(next); }} />)}
          <Button size="small" onClick={() => update([...columns, 'Column'])}>Add Column</Button>
          <Button size="small" onClick={() => update(columns, [...rows, {}])}>Add Row</Button>
        </Stack>
      )}
      <Table size="small">
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{column}</TableCell>)}{!preview && <TableCell />}</TableRow></TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => <TableCell key={column}>{preview ? row[column] : <TextField size="small" value={row[column] || ''} onChange={(e) => { const next = [...rows]; next[rowIndex] = { ...row, [column]: e.target.value }; update(columns, next); }} />}</TableCell>)}
              {!preview && <TableCell><IconButton size="small" onClick={() => update(columns, rows.filter((_, i) => i !== rowIndex))}><DeleteTwoToneIcon fontSize="small" /></IconButton></TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function ChecklistSegment({ segment, onChange, preview }) {
  const items: any[] = segment.content?.items || [];
  const statuses: string[] = segment.config?.statuses || [];
  const update = (nextItems = items) => onChange({ ...segment, content: { ...segment.content, items: nextItems } });
  return (
    <Box>
      {!preview && <Button size="small" sx={{ mb: 1 }} onClick={() => update([...items, { task: '', status: statuses[0] || '', comment: '' }])}>Add Line</Button>}
      <Table size="small">
        <TableHead><TableRow><TableCell>Task</TableCell><TableCell>Status</TableCell><TableCell>Comment</TableCell>{!preview && <TableCell />}</TableRow></TableHead>
        <TableBody>{items.map((item, i) => <TableRow key={i}>
          <TableCell>{preview ? item.task : <TextField size="small" value={item.task || ''} onChange={(e) => { const next = [...items]; next[i] = { ...item, task: e.target.value }; update(next); }} />}</TableCell>
          <TableCell>{preview ? item.status : <Select size="small" value={item.status || ''} onChange={(e) => { const next = [...items]; next[i] = { ...item, status: e.target.value }; update(next); }}>{statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select>}</TableCell>
          <TableCell>{preview ? item.comment : <TextField size="small" value={item.comment || ''} onChange={(e) => { const next = [...items]; next[i] = { ...item, comment: e.target.value }; update(next); }} />}</TableCell>
          {!preview && <TableCell><IconButton size="small" onClick={() => update(items.filter((_, index) => index !== i))}><DeleteTwoToneIcon fontSize="small" /></IconButton></TableCell>}
        </TableRow>)}</TableBody>
      </Table>
    </Box>
  );
}

function SignatureSegment({ segment, onChange, preview }) {
  const parties: any[] = segment.content?.parties || [];
  const update = (nextParties = parties) => onChange({ ...segment, content: { ...segment.content, parties: nextParties } });
  return (
    <Box>
      {!preview && <Button size="small" sx={{ mb: 1 }} onClick={() => update([...parties, { label: '', name: '', title: '', date: '', signature: '' }])}>Add Party</Button>}
      <Grid container spacing={1}>
        {parties.map((party, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Paper sx={{ p: 1 }}>
              {['label', 'name', 'title', 'date', 'signature'].map((field) => (
                preview ? <Typography key={field} variant="body2"><b>{field}:</b> {party[field]}</Typography> :
                  <TextField key={field} fullWidth size="small" sx={{ mb: 1 }} label={field} value={party[field] || ''} onChange={(e) => { const next = [...parties]; next[i] = { ...party, [field]: e.target.value }; update(next); }} />
              ))}
              {!preview && <Button color="error" size="small" onClick={() => update(parties.filter((_, index) => index !== i))}>Remove</Button>}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default CmPmReports;
