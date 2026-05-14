package com.company.pm.repository;

import com.company.pm.entity.SignupRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SignupRequestRepository extends JpaRepository<SignupRequestEntity, String> {

    @Query("SELECT s FROM SignupRequestEntity s WHERE s.status = 'PENDING'")
    List<SignupRequestEntity> findPendingRequests();
}
