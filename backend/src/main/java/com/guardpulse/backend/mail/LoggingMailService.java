package com.guardpulse.backend.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "mail.enabled", havingValue = "false", matchIfMissing = true)
public class LoggingMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingMailService.class);

    @Override
    public void send(String to, String subject, String body) {
        log.info("""

                ================= EMAIL (mail.enabled=false, logged instead of sent) =================
                To:      {}
                Subject: {}
                --------------------------------------------------------------------------------------
                {}
                ========================================================================================
                """, to, subject, body);
    }
}


