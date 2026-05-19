package com.grash.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grash.dto.CmPmReportSearchDTO;
import com.grash.exception.CustomException;
import com.grash.model.CmPmReport;
import com.grash.model.Company;
import com.grash.model.enums.CmPmReportStatus;
import com.grash.repository.CmPmReportRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CmPmReportService {
    private final CmPmReportRepository repository;
    private final ObjectMapper objectMapper;

    public Collection<CmPmReport> search(CmPmReportSearchDTO dto, Long companyId) {
        if (dto == null) return repository.findByCompany_IdOrderByReportDateDesc(companyId);
        return repository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (dto.getReportType() != null) predicates.add(cb.equal(root.get("reportType"), dto.getReportType()));
            if (dto.getStatus() != null) predicates.add(cb.equal(root.get("status"), dto.getStatus()));
            if (hasText(dto.getClientName())) {
                predicates.add(cb.like(cb.lower(root.get("clientName")), "%" + dto.getClientName().toLowerCase() + "%"));
            }
            if (hasText(dto.getFacilityLocation())) {
                predicates.add(cb.like(cb.lower(root.get("facilityLocation")),
                        "%" + dto.getFacilityLocation().toLowerCase() + "%"));
            }
            if (hasText(dto.getReportRef())) {
                predicates.add(cb.like(cb.lower(root.get("reportRef")), "%" + dto.getReportRef().toLowerCase() + "%"));
            }
            if (dto.getStartDate() != null) predicates.add(cb.greaterThanOrEqualTo(root.get("reportDate"), dto.getStartDate()));
            if (dto.getEndDate() != null) predicates.add(cb.lessThanOrEqualTo(root.get("reportDate"), dto.getEndDate()));
            query.orderBy(cb.desc(root.get("reportDate")));
            return cb.and(predicates.toArray(new Predicate[0]));
        });
    }

    public Optional<CmPmReport> findByIdAndCompany(Long id, Long companyId) {
        return repository.findByIdAndCompany_Id(id, companyId);
    }

    public CmPmReport create(CmPmReport report, Company company) {
        validate(report, company, null, false);
        return repository.save(report);
    }

    public CmPmReport update(Long id, CmPmReport report, Company company) {
        CmPmReport saved = repository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Not found", HttpStatus.NOT_FOUND));
        validate(report, company, saved.getReportRef(), false);
        saved.setReportRef(report.getReportRef());
        saved.setReportType(report.getReportType());
        saved.setTitle(report.getTitle());
        saved.setProjectName(report.getProjectName());
        saved.setClientName(report.getClientName());
        saved.setContractorName(report.getContractorName());
        saved.setFacilityLocation(report.getFacilityLocation());
        saved.setSystemLocation(report.getSystemLocation());
        saved.setEquipmentId(report.getEquipmentId());
        saved.setReportDate(report.getReportDate());
        saved.setPreparedBy(report.getPreparedBy());
        saved.setStatus(report.getStatus() == null ? CmPmReportStatus.DRAFT : report.getStatus());
        saved.setMetadata(report.getMetadata());
        saved.setSegments(report.getSegments());
        return repository.save(saved);
    }

    public CmPmReport duplicate(Long id, Company company) {
        CmPmReport saved = repository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Not found", HttpStatus.NOT_FOUND));
        CmPmReport copy = new CmPmReport();
        copy.setReportRef(nextCopyRef(saved.getReportRef(), company.getId()));
        copy.setReportType(saved.getReportType());
        copy.setTitle(saved.getTitle());
        copy.setProjectName(saved.getProjectName());
        copy.setClientName(saved.getClientName());
        copy.setContractorName(saved.getContractorName());
        copy.setFacilityLocation(saved.getFacilityLocation());
        copy.setSystemLocation(saved.getSystemLocation());
        copy.setEquipmentId(saved.getEquipmentId());
        copy.setReportDate(new Date());
        copy.setPreparedBy(saved.getPreparedBy());
        copy.setStatus(CmPmReportStatus.DRAFT);
        copy.setMetadata(saved.getMetadata());
        copy.setSegments(saved.getSegments());
        return repository.save(copy);
    }

    public void delete(Long id, Long companyId) {
        CmPmReport saved = repository.findByIdAndCompany_Id(id, companyId)
                .orElseThrow(() -> new CustomException("Not found", HttpStatus.NOT_FOUND));
        repository.delete(saved);
    }

    public void validate(CmPmReport report, Company company, String existingRef, boolean requireSegments) {
        if (!hasText(report.getReportRef())) throw new CustomException("Report Reference Number is required", HttpStatus.NOT_ACCEPTABLE);
        if (report.getReportType() == null) throw new CustomException("Report Type is required", HttpStatus.NOT_ACCEPTABLE);
        if (!hasText(report.getProjectName())) throw new CustomException("Project Name is required", HttpStatus.NOT_ACCEPTABLE);
        if (report.getReportDate() == null) throw new CustomException("Report Date is required", HttpStatus.NOT_ACCEPTABLE);
        if (report.getStatus() == null) report.setStatus(CmPmReportStatus.DRAFT);
        if (report.getMetadata() == null || report.getMetadata().isNull()) report.setMetadata(objectMapper.createObjectNode());
        if (report.getSegments() == null || report.getSegments().isNull()) report.setSegments(objectMapper.createArrayNode());
        if (requireSegments && (!report.getSegments().isArray() || report.getSegments().isEmpty())) {
            throw new CustomException("At least one segment is required", HttpStatus.NOT_ACCEPTABLE);
        }
        if ((existingRef == null || !existingRef.equalsIgnoreCase(report.getReportRef()))
                && repository.existsByReportRefIgnoreCaseAndCompany_Id(report.getReportRef(), company.getId())) {
            throw new CustomException("Report Reference Number already exists", HttpStatus.CONFLICT);
        }
    }

    public void validateForExport(CmPmReport report, Company company) {
        validate(report, company, report.getReportRef(), true);
    }

    public JsonNode emptySegments() {
        return objectMapper.createArrayNode();
    }

    private String nextCopyRef(String sourceRef, Long companyId) {
        String base = sourceRef + "-COPY";
        String candidate = base;
        int index = 2;
        while (repository.existsByReportRefIgnoreCaseAndCompany_Id(candidate, companyId)) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
