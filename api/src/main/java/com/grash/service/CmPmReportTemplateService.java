package com.grash.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grash.model.CmPmReport;
import com.grash.model.enums.CmPmReportStatus;
import com.grash.model.enums.CmPmReportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CmPmReportTemplateService {
    private final ObjectMapper objectMapper;

    public List<Map<String, Object>> getTemplates() {
        return Arrays.asList(
                template("fm200-cm", "FM200 Corrective Maintenance Report", CmPmReportType.CM),
                template("sentry-siren-pm", "Sentry Siren Preventive Maintenance Report", CmPmReportType.PM),
                template("sentry-siren-cm", "Sentry Siren Corrective Maintenance Report", CmPmReportType.CM)
        );
    }

    public CmPmReport buildReport(String key) {
        CmPmReport report = new CmPmReport();
        report.setStatus(CmPmReportStatus.DRAFT);
        report.setReportDate(new Date());
        report.setMetadata(objectMapper.valueToTree(defaultMetadata()));
        switch (key) {
            case "fm200-cm":
                report.setTitle("FM200 Corrective Maintenance Report");
                report.setReportType(CmPmReportType.CM);
                report.setSegments(toJson(Arrays.asList(
                        text("Introduction & Scope of Work"),
                        table("Fire Alarm & Suppression System FM200 table",
                                Arrays.asList("Task", "Status", "Readings", "Comment")),
                        text("Additional Comments & Report Summary"),
                        signature("Contractor Certification & Client Acceptance")
                )));
                break;
            case "sentry-siren-pm":
                report.setTitle("Sentry Siren Preventive Maintenance Report");
                report.setReportType(CmPmReportType.PM);
                report.setSegments(toJson(Arrays.asList(
                        text("Introduction & Scope of Work"),
                        table("Site & System Identification", Arrays.asList("Field Details", "Information Data")),
                        checklist("Siren Head & Mechanical Inspection"),
                        checklist("GEN 3 Wireless Radio Controller"),
                        checklist("Battery & Charging System"),
                        checklist("Power Distribution & Starter"),
                        checklist("Portable Units"),
                        text("Additional Comments & Report Summary"),
                        signature("Contractor Certification & Client Acceptance")
                )));
                break;
            case "sentry-siren-cm":
                report.setTitle("Sentry Siren Corrective Maintenance Report");
                report.setReportType(CmPmReportType.CM);
                report.setSegments(toJson(Arrays.asList(
                        text("Introduction & Scope of Work"),
                        table("Site & System Identification", Arrays.asList("Field Details", "Information Data")),
                        checklist("Battery & Charging System"),
                        checklist("Function Test and Siren Activation"),
                        table("Parts Consumption / Replacement Logs",
                                Arrays.asList("Item Description", "Replaced", "Quantity", "Comments")),
                        text("Additional Comments & Report Summary"),
                        signature("Contractor Certification & Client Acceptance")
                )));
                break;
            default:
                throw new IllegalArgumentException("Unknown report template");
        }
        return report;
    }

    private Map<String, Object> template(String key, String name, CmPmReportType type) {
        Map<String, Object> template = new LinkedHashMap<>();
        template.put("key", key);
        template.put("name", name);
        template.put("reportType", type);
        return template;
    }

    private Map<String, Object> defaultMetadata() {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("fieldLabels", new LinkedHashMap<String, String>() {{
            put("projectName", "Project Name");
            put("clientName", "Client / Beneficiary");
            put("contractorName", "Contractor");
            put("reportType", "Type of Report");
            put("facilityLocation", "Facility Location");
            put("systemLocation", "System Location / Zone");
            put("equipmentId", "System ID / Siren ID / Equipment ID");
            put("reportRef", "Report Reference Number");
            put("reportDate", "Report Date");
            put("preparedBy", "Prepared By");
        }});
        return metadata;
    }

    private JsonNode toJson(Object value) {
        return objectMapper.valueToTree(value);
    }

    private Map<String, Object> base(String type, String title) {
        Map<String, Object> segment = new LinkedHashMap<>();
        segment.put("id", UUID.randomUUID().toString());
        segment.put("type", type);
        segment.put("title", title);
        segment.put("collapsed", false);
        return segment;
    }

    private Map<String, Object> text(String title) {
        Map<String, Object> segment = base("text", title);
        segment.put("content", new LinkedHashMap<String, Object>() {{
            put("text", "");
        }});
        return segment;
    }

    private Map<String, Object> table(String title, List<String> columns) {
        Map<String, Object> segment = base("table", title);
        segment.put("config", new LinkedHashMap<String, Object>() {{
            put("columns", columns);
        }});
        segment.put("content", new LinkedHashMap<String, Object>() {{
            put("rows", new ArrayList<>());
        }});
        return segment;
    }

    private Map<String, Object> checklist(String title) {
        Map<String, Object> segment = base("checklist", title);
        segment.put("config", new LinkedHashMap<String, Object>() {{
            put("statuses", Arrays.asList("Normal / OK", "Warning / Observation", "Critical / Failed", "Checked",
                    "Not Checked", "Yes", "No"));
        }});
        segment.put("content", new LinkedHashMap<String, Object>() {{
            put("items", new ArrayList<>());
        }});
        return segment;
    }

    private Map<String, Object> signature(String title) {
        Map<String, Object> segment = base("signature", title);
        segment.put("content", new LinkedHashMap<String, Object>() {{
            put("parties", Arrays.asList(
                    new LinkedHashMap<String, Object>() {{
                        put("label", "Contractor Representative");
                        put("name", "");
                        put("title", "");
                        put("date", "");
                        put("signature", "");
                    }},
                    new LinkedHashMap<String, Object>() {{
                        put("label", "Client Representative");
                        put("name", "");
                        put("title", "");
                        put("date", "");
                        put("signature", "");
                    }}
            ));
        }});
        return segment;
    }
}
