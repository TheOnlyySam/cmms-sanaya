package com.grash.dto;

import com.grash.model.enums.CmPmReportStatus;
import com.grash.model.enums.CmPmReportType;
import lombok.Data;

import java.util.Date;

@Data
public class CmPmReportSearchDTO {
    private CmPmReportType reportType;
    private String clientName;
    private String facilityLocation;
    private CmPmReportStatus status;
    private String reportRef;
    private Date startDate;
    private Date endDate;
}
