package com.grash.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.grash.dto.CmPmReportSearchDTO;
import com.grash.dto.SuccessResponse;
import com.grash.exception.CustomException;
import com.grash.factory.StorageServiceFactory;
import com.grash.model.CmPmReport;
import com.grash.model.OwnUser;
import com.grash.model.enums.PermissionEntity;
import com.grash.service.CmPmReportService;
import com.grash.service.CmPmReportTemplateService;
import com.grash.service.UserService;
import com.grash.utils.MultipartFileImpl;
import com.itextpdf.html2pdf.HtmlConverter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cm-pm-reports")
@Tag(name = "cmPmReports")
@RequiredArgsConstructor
@Transactional
public class CmPmReportController {
    private final CmPmReportService reportService;
    private final CmPmReportTemplateService templateService;
    private final UserService userService;
    private final StorageServiceFactory storageServiceFactory;

    @PostMapping("/search")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public Collection<CmPmReport> search(@RequestBody(required = false) CmPmReportSearchDTO searchDTO,
                                         HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "view");
        return reportService.search(searchDTO, user.getCompany().getId());
    }

    @GetMapping("/templates")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public List<Map<String, Object>> templates(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "create");
        return templateService.getTemplates();
    }

    @PostMapping("/templates/{key}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public CmPmReport createFromTemplate(@PathVariable String key, @RequestBody CmPmReport overrides,
                                         HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "create");
        CmPmReport report = templateService.buildReport(key);
        applyOverrides(report, overrides);
        return reportService.create(report, user.getCompany());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public CmPmReport get(@PathVariable Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "view");
        return reportService.findByIdAndCompany(id, user.getCompany().getId())
                .orElseThrow(() -> new CustomException("Not found", HttpStatus.NOT_FOUND));
    }

    @PostMapping("")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public CmPmReport create(@RequestBody CmPmReport report, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "create");
        return reportService.create(report, user.getCompany());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public CmPmReport update(@PathVariable Long id, @RequestBody CmPmReport report, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "edit");
        return reportService.update(id, report, user.getCompany());
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public CmPmReport duplicate(@PathVariable Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "create");
        return reportService.duplicate(id, user.getCompany());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public SuccessResponse delete(@PathVariable Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "delete");
        reportService.delete(id, user.getCompany().getId());
        return new SuccessResponse(true, "Deleted");
    }

    @GetMapping("/{id}/report")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    public ResponseEntity<SuccessResponse> exportPdf(@PathVariable Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        require(user, "view");
        CmPmReport report = reportService.findByIdAndCompany(id, user.getCompany().getId())
                .orElseThrow(() -> new CustomException("Not found", HttpStatus.NOT_FOUND));
        reportService.validateForExport(report, user.getCompany());
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(buildPdfHtml(report, user), target);
        MultipartFile file = new MultipartFileImpl(target.toByteArray(), report.getReportRef() + ".pdf");
        return ResponseEntity.ok(new SuccessResponse(true, storageServiceFactory.getStorageService()
                .uploadAndSign(file, "cm-pm-reports/" + user.getCompany().getId())));
    }

    private void require(OwnUser user, String action) {
        boolean allowed;
        switch (action) {
            case "create":
                allowed = user.getRole().getCreatePermissions().contains(PermissionEntity.CM_PM_REPORTS);
                break;
            case "edit":
                allowed = user.getRole().getEditOtherPermissions().contains(PermissionEntity.CM_PM_REPORTS);
                break;
            case "delete":
                allowed = user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.CM_PM_REPORTS);
                break;
            default:
                allowed = user.getRole().getViewPermissions().contains(PermissionEntity.CM_PM_REPORTS);
        }
        if (!allowed) throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    private void applyOverrides(CmPmReport report, CmPmReport overrides) {
        if (overrides == null) return;
        report.setReportRef(overrides.getReportRef());
        if (overrides.getReportType() != null) report.setReportType(overrides.getReportType());
        if (overrides.getTitle() != null) report.setTitle(overrides.getTitle());
        report.setProjectName(overrides.getProjectName());
        report.setClientName(overrides.getClientName());
        report.setContractorName(overrides.getContractorName());
        report.setFacilityLocation(overrides.getFacilityLocation());
        report.setSystemLocation(overrides.getSystemLocation());
        report.setEquipmentId(overrides.getEquipmentId());
        if (overrides.getReportDate() != null) report.setReportDate(overrides.getReportDate());
        report.setPreparedBy(overrides.getPreparedBy());
        if (overrides.getStatus() != null) report.setStatus(overrides.getStatus());
        if (overrides.getMetadata() != null) report.setMetadata(overrides.getMetadata());
    }

    private String buildPdfHtml(CmPmReport report, OwnUser user) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        StringBuilder html = new StringBuilder();
        html.append("<!doctype html><html><head><meta charset='utf-8'><style>");
        html.append("@page{size:A4;margin:18mm 14mm 20mm;}body{font-family:Arial,sans-serif;color:#1f2937;font-size:12px;}");
        html.append("h1{font-size:24px;margin:0 0 8px;}h2{font-size:16px;margin:22px 0 8px;color:#0f172a;}");
        html.append(".top{border-bottom:3px solid #1f4e79;padding-bottom:12px;margin-bottom:18px;}");
        html.append(".brand{font-size:13px;color:#475569}.badge{display:inline-block;background:#1f4e79;color:white;padding:5px 9px;border-radius:3px;}");
        html.append("table{width:100%;border-collapse:collapse;margin:8px 0 14px;}td,th{border:1px solid #cbd5e1;padding:7px;vertical-align:top;}th{background:#e2e8f0;text-align:left;}");
        html.append(".toc li{margin:5px 0}.box{border:1px solid #cbd5e1;padding:10px;min-height:44px;background:#f8fafc;white-space:pre-wrap;}");
        html.append(".footer{position:running(footer);font-size:10px;color:#64748b}.signature{height:54px;}");
        html.append("</style></head><body>");
        html.append("<div class='top'><div class='brand'>").append(esc(user.getCompany().getName())).append("</div>");
        html.append("<h1>").append(esc(report.getTitle() == null ? "CM/PM Report" : report.getTitle())).append("</h1>");
        html.append("<span class='badge'>").append(esc(report.getReportType().name())).append(" - ").append(esc(report.getReportRef())).append("</span></div>");
        html.append("<h2>Report Details</h2><table>");
        detailsRow(html, "Project Name", report.getProjectName(), "Client / Beneficiary", report.getClientName());
        detailsRow(html, "Contractor", report.getContractorName(), "Facility Location", report.getFacilityLocation());
        detailsRow(html, "System / Site / Zone", report.getSystemLocation(), "System / Equipment ID", report.getEquipmentId());
        detailsRow(html, "Report Date", report.getReportDate() == null ? "" : dateFormat.format(report.getReportDate()), "Prepared By", report.getPreparedBy());
        detailsRow(html, "Status", report.getStatus().name(), "Reference", report.getReportRef());
        html.append("</table><h2>Table of Contents</h2><ol class='toc'>");
        if (report.getSegments() != null && report.getSegments().isArray()) {
            for (JsonNode segment : report.getSegments()) html.append("<li>").append(esc(segment.path("title").asText("Untitled"))).append("</li>");
        }
        html.append("</ol>");
        int index = 1;
        if (report.getSegments() != null && report.getSegments().isArray()) {
            for (JsonNode segment : report.getSegments()) {
                html.append("<h2>").append(index++).append(". ").append(esc(segment.path("title").asText("Untitled"))).append("</h2>");
                appendSegment(html, segment);
            }
        }
        html.append("</body></html>");
        return html.toString();
    }

    private void appendSegment(StringBuilder html, JsonNode segment) {
        String type = segment.path("type").asText();
        JsonNode content = segment.path("content");
        if ("table".equals(type)) {
            JsonNode columns = segment.path("config").path("columns");
            html.append("<table><thead><tr>");
            columns.forEach(column -> html.append("<th>").append(esc(column.asText())).append("</th>"));
            html.append("</tr></thead><tbody>");
            content.path("rows").forEach(row -> {
                html.append("<tr>");
                for (JsonNode column : columns) html.append("<td>").append(esc(row.path(column.asText()).asText())).append("</td>");
                html.append("</tr>");
            });
            html.append("</tbody></table>");
        } else if ("checklist".equals(type)) {
            html.append("<table><thead><tr><th>Task</th><th>Status</th><th>Comment</th></tr></thead><tbody>");
            content.path("items").forEach(item -> html.append("<tr><td>").append(esc(item.path("task").asText()))
                    .append("</td><td>").append(esc(item.path("status").asText()))
                    .append("</td><td>").append(esc(item.path("comment").asText())).append("</td></tr>"));
            html.append("</tbody></table>");
        } else if ("signature".equals(type)) {
            html.append("<table><thead><tr><th>Organization / Representative</th><th>Name</th><th>Title</th><th>Date</th><th>Signature</th></tr></thead><tbody>");
            content.path("parties").forEach(party -> html.append("<tr><td>").append(esc(party.path("label").asText()))
                    .append("</td><td>").append(esc(party.path("name").asText()))
                    .append("</td><td>").append(esc(party.path("title").asText()))
                    .append("</td><td>").append(esc(party.path("date").asText()))
                    .append("</td><td class='signature'>").append(signature(party.path("signature").asText())).append("</td></tr>"));
            html.append("</tbody></table>");
        } else {
            html.append("<div class='box'>").append(esc(content.path("text").asText())).append("</div>");
        }
    }

    private String signature(String value) {
        if (value != null && value.startsWith("data:image")) {
            return "<img src='" + esc(value) + "' style='max-height:52px;max-width:140px'/>";
        }
        return esc(value);
    }

    private void detailsRow(StringBuilder html, String label1, String value1, String label2, String value2) {
        html.append("<tr><th>").append(esc(label1)).append("</th><td>").append(esc(value1))
                .append("</td><th>").append(esc(label2)).append("</th><td>").append(esc(value2)).append("</td></tr>");
    }

    private String esc(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
