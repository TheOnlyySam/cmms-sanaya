package com.grash.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.grash.model.abstracts.CompanyAudit;
import com.grash.model.enums.CmPmReportStatus;
import com.grash.model.enums.CmPmReportType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_cm_pm_report_company", columnList = "company_id"),
        @Index(name = "idx_cm_pm_report_ref", columnList = "report_ref")
})
public class CmPmReport extends CompanyAudit {
    @NotBlank
    @Column(nullable = false)
    private String reportRef;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CmPmReportType reportType;

    private String title;

    @NotBlank
    @Column(nullable = false)
    private String projectName;

    private String clientName;

    private String contractorName;

    private String facilityLocation;

    private String systemLocation;

    private String equipmentId;

    @NotNull
    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date reportDate;

    private String preparedBy;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CmPmReportStatus status = CmPmReportStatus.DRAFT;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode metadata;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode segments;
}
