package com.grash.factory;

import com.grash.model.enums.MailType;
import com.grash.service.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class MailServiceFactory {
    @Value("${mail.type:SMTP}")
    private MailType mailType;

    @Qualifier("emailService2")
    private final MailService emailService2;
    @Qualifier("sendgridService")
    private final MailService sendgridService;

    public MailService getMailService() {
        switch (mailType) {
            case SENDGRID:
                return sendgridService;
            default:
                return emailService2;
        }
    }
}
