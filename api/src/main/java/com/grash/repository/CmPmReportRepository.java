package com.grash.repository;

import com.grash.model.CmPmReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.Optional;

public interface CmPmReportRepository extends JpaRepository<CmPmReport, Long>, JpaSpecificationExecutor<CmPmReport> {
    Collection<CmPmReport> findByCompany_IdOrderByReportDateDesc(Long companyId);

    Optional<CmPmReport> findByIdAndCompany_Id(Long id, Long companyId);

    boolean existsByReportRefIgnoreCaseAndCompany_Id(String reportRef, Long companyId);
}
